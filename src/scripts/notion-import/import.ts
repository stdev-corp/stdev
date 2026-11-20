/*
 * content/ 묶음을 DB와 S3에 넣는다. 노션·Oopy를 지우기 전에 한 번 실행한다.
 *
 *   pnpm notion:import --env-file .env --dry-run   # 계획만 출력
 *   pnpm notion:import --env-file .env             # 실제로 넣기
 *
 * - 이미지·파일은 노션(또는 assets/)에서 내려받아 S3의 images/notion-…, files/notion-…
 *   에 올리고 ImageAsset/FileAsset 행을 만든다. 키가 원본 주소로 정해지므로 다시
 *   실행해도 같은 객체를 덮어쓸 뿐 늘어나지 않는다.
 * - 기관은 국문명이 같으면 그대로 쓰고, 없으면 홈 노출을 끈 채로 만든다.
 * - 행사는 슬러그 → 노션 ID → 코드 → 이름 순으로 기존 사업을 찾는다. 기존 사업이
 *   아직 행사 내용이 없으면(슬러그·노션 ID·본문·요약이 모두 비어 있으면) 노션 내용으로
 *   채우되 이름과 코드는 바꾸지 않는다. 이미 채워진 행사와 하위 페이지는 --force가 없으면 건드리지
 *   않으므로, 관리자 화면에서 고친 내용을 덮어쓰지 않는다.
 * - 구역 소개 마크다운은 해당 유형이 하나도 없을 때만 만든다.
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { config } from 'dotenv'

const { values: options } = parseArgs({
  // pnpm notion:import -- --dry-run 처럼 넘어오는 '--'는 무시한다.
  args: process.argv.slice(2).filter((arg) => arg !== '--'),
  options: {
    'env-file': { type: 'string', default: '.env' },
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
  },
})
config({ path: options['env-file'], override: true })

const ROOT = path.resolve('src/scripts/notion-import')
const CONTENT = path.join(ROOT, 'content')
const LOCAL_ASSETS = path.join(ROOT, 'assets')

async function main() {
  // 환경 변수를 읽은 뒤에 DB·S3 모듈을 불러온다.
  const { PrismaClient } = await import('@prisma/client')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3')
  const sharp = (await import('sharp')).default
  const { withDatabaseSslParams } = await import('@/utils/database-url')
  const { toEventInstant } = await import('@/utils/events')
  const { imageDownloadUrl, signedFileUrl } = await import('./notion-api')
  const { ASSET_SCHEME, assetIdentity } = await import('./to-markdown')
  type Bundle = import('./convert').Bundle
  type AssetRef = import('./to-markdown').AssetRef

  const dryRun = options['dry-run']
  const force = options.force
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL이 필요합니다.')

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: withDatabaseSslParams(databaseUrl),
    }),
  })
  const region = process.env.AWS_REGION ?? 'ap-northeast-2'
  const bucket = process.env.S3_BUCKET ?? 'stdev-kr'
  const endpoint = process.env.AWS_ENDPOINT_URL_S3
  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY ?? '',
      secretAccessKey: process.env.AWS_SECRET_KEY ?? '',
    },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  })

  const bundle = JSON.parse(
    await readFile(path.join(CONTENT, 'bundle.json'), 'utf8'),
  ) as Bundle
  const log = (message: string) =>
    console.log(`${dryRun ? '[계획] ' : ''}${message}`)

  /* ---------------------------------------------------------------- *
   * 자산
   * ---------------------------------------------------------------- */
  async function download(
    asset: AssetRef,
  ): Promise<{ body: Buffer; type: string | null }> {
    if (asset.source.startsWith('local:')) {
      const file = asset.source.slice('local:'.length)
      return {
        body: await readFile(path.join(LOCAL_ASSETS, file)),
        type: 'image/jpeg',
      }
    }
    const notionHosted =
      /^(attachment:|\/images\/)/.test(asset.source) ||
      /^https:\/\/(prod-files-secure\.s3|s3[.-]us-west-2\.amazonaws\.com\/(secure|public)\.notion-static\.com)/.test(
        asset.source,
      )
    let url = asset.source
    if (notionHosted) {
      url =
        asset.kind === 'image'
          ? imageDownloadUrl(asset.source, asset.blockId)
          : await signedFileUrl(asset.source, asset.blockId)
    }
    const response = await fetch(url, {
      headers: { 'user-agent': 'curl/8.7.1' },
    })
    if (!response.ok) {
      throw new Error(`${asset.key} 내려받기 실패 ${response.status}: ${url}`)
    }
    return {
      body: Buffer.from(await response.arrayBuffer()),
      type: response.headers.get('content-type'),
    }
  }

  function safeName(filename: string) {
    return filename
      .normalize('NFC')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(-80)
  }

  function extensionFor(type: string | null, filename: string) {
    const fromName = /\.([a-z0-9]{2,5})$/i.exec(filename)?.[1]?.toLowerCase()
    if (fromName) return fromName
    if (type?.includes('png')) return 'png'
    if (type?.includes('jpeg')) return 'jpg'
    if (type?.includes('gif')) return 'gif'
    if (type?.includes('webp')) return 'webp'
    if (type?.includes('svg')) return 'svg'
    return 'bin'
  }

  const assetUrls = new Map<string, string>()
  const assetIds = new Map<string, number>()

  async function uploadAsset(asset: AssetRef) {
    const prefix = asset.kind === 'image' ? 'images' : 'files'
    const hash = createHash('sha1')
      .update(assetIdentity(asset.source))
      .digest('hex')
      .slice(0, 12)
    const base = safeName(asset.filename) || 'asset'
    const preliminaryKey = `${prefix}/notion-${hash}-${base}`
    const plannedUrl = `https://${bucket}.s3.${region}.amazonaws.com/${preliminaryKey}`

    const existing =
      asset.kind === 'image'
        ? await prisma.imageAsset.findFirst({
            where: { url: { startsWith: plannedUrl.replace(/\.[^./]+$/, '') } },
          })
        : await prisma.fileAsset.findFirst({
            where: { url: { startsWith: plannedUrl.replace(/\.[^./]+$/, '') } },
          })
    if (existing?.url) {
      assetUrls.set(asset.key, existing.url)
      assetIds.set(asset.key, existing.id)
      return
    }
    if (dryRun) {
      log(`자산 올리기: ${asset.kind} ${asset.filename}`)
      assetUrls.set(asset.key, plannedUrl)
      return
    }

    const { body, type } = await download(asset)
    const extension = extensionFor(type, base)
    const key = /\.[a-z0-9]{2,5}$/i.test(preliminaryKey)
      ? preliminaryKey
      : `${preliminaryKey}.${extension}`
    const contentType =
      asset.kind === 'video'
        ? 'video/mp4'
        : asset.kind === 'file'
          ? 'application/pdf'
          : type && type.startsWith('image/')
            ? type
            : `image/${extension === 'jpg' ? 'jpeg' : extension === 'svg' ? 'svg+xml' : extension}`
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    if (asset.kind === 'image') {
      const metadata = await sharp(body, { limitInputPixels: false })
        .metadata()
        .catch(() => ({ width: undefined, height: undefined }))
      const row = await prisma.imageAsset.create({
        data: {
          alt: asset.alt || null,
          filename: asset.filename,
          url,
          mimeType: contentType,
          filesize: body.length,
          prefix: 'images',
          width: metadata.width ?? null,
          height: metadata.height ?? null,
        },
      })
      assetIds.set(asset.key, row.id)
    } else {
      const row = await prisma.fileAsset.create({
        data: {
          filename: asset.filename,
          url,
          mimeType: contentType,
          filesize: body.length,
          prefix: 'files',
        },
      })
      assetIds.set(asset.key, row.id)
    }
    assetUrls.set(asset.key, url)
    log(`자산 올림: ${key}`)
  }

  // 노션에서도 이미 깨진 외부 이미지(만료된 서명 주소 등)는 경고하고 뺀다.
  const failed = new Set<string>()
  const queue = [...bundle.assets]
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length > 0) {
      const asset = queue.shift()!
      try {
        await uploadAsset(asset)
      } catch (error) {
        failed.add(asset.key)
        console.warn(
          `경고: 자산을 옮기지 못해 본문에서 뺍니다 (${asset.key} ${asset.filename}):`,
          error instanceof Error ? error.message.slice(0, 160) : error,
        )
      }
    }
  })
  await Promise.all(workers)

  function fill(markdown: string) {
    let out = markdown
    for (const key of failed) {
      const ref = `${ASSET_SCHEME}${key}`
      out = out
        .split('\n')
        .filter((line) => !(line.trim().startsWith('::') && line.includes(ref)))
        .join('\n')
        .replace(
          new RegExp(`!\\[[^\\]]*\\]\\(${ref}\\)(\\\\\\n\\s*)?`, 'g'),
          '',
        )
    }
    return out.replace(/notion-asset:([\w-]+)/g, (match, key: string) => {
      const url = assetUrls.get(key)
      if (!url) throw new Error(`자산 주소가 없습니다: ${match}`)
      return url
    })
  }

  async function readContent(file: string | null) {
    if (!file) return ''
    return fill((await readFile(path.join(CONTENT, file), 'utf8')).trim())
  }

  function iconOf(icon: string | null) {
    if (!icon) return null
    if (
      icon.startsWith(ASSET_SCHEME) &&
      failed.has(icon.slice(ASSET_SCHEME.length))
    )
      return null
    return icon.startsWith(ASSET_SCHEME) ? fill(icon) : icon
  }

  /* ---------------------------------------------------------------- *
   * 기관
   * ---------------------------------------------------------------- */
  const institutionIds = new Map<string, number>()
  for (const institution of bundle.institutions) {
    const existing = await prisma.institution.findUnique({
      where: { nameKo: institution.nameKo },
    })
    if (existing) {
      institutionIds.set(institution.nameKo, existing.id)
      continue
    }
    if (dryRun) {
      log(`기관 추가: ${institution.nameKo}`)
      institutionIds.set(institution.nameKo, -1)
      continue
    }
    const urlTaken =
      institution.url &&
      (await prisma.institution.findUnique({ where: { url: institution.url } }))
    const created = await prisma.institution.create({
      data: {
        nameKo: institution.nameKo,
        url: urlTaken ? null : institution.url,
        showOnHome: false,
      },
    })
    institutionIds.set(institution.nameKo, created.id)
    log(`기관 추가: ${institution.nameKo}`)
  }

  /* ---------------------------------------------------------------- *
   * 구역 소개
   * ---------------------------------------------------------------- */
  const today = new Date(new Date().toISOString().slice(0, 10))
  for (const type of ['hackathon', 'conference'] as const) {
    const count = await prisma.markdown.count({ where: { type } })
    if (count > 0) continue
    log(`구역 소개 추가: ${type}`)
    if (!dryRun) {
      await prisma.markdown.create({
        data: {
          type,
          revisionDate: today,
          effectiveDate: today,
          content: bundle.intros[type],
        },
      })
    }
  }

  /* ---------------------------------------------------------------- *
   * 행사와 하위 페이지
   * ---------------------------------------------------------------- */
  const existingAll = await prisma.business.findMany()
  const matched = new Set<number>()
  for (const event of bundle.events) {
    const existing =
      existingAll.find(
        (business) => event.slug && business.slug === event.slug,
      ) ??
      existingAll.find(
        (business) => event.notionId && business.notionId === event.notionId,
      ) ??
      existingAll.find(
        (business) => business.code.toLowerCase() === event.code.toLowerCase(),
      ) ??
      existingAll.find((business) => business.name === event.name)

    const data = {
      slug: event.slug,
      category: event.category,
      startDate: toEventInstant(event.startDate, event.startTime),
      endDate: toEventInstant(event.endDate, event.endTime),
      hasTime: Boolean(event.startTime),
      location: event.location,
      icon: iconOf(event.icon),
      coverImageId: event.cover ? (assetIds.get(event.cover) ?? null) : null,
      summary: event.summary ? fill(event.summary) : null,
      content: await readContent(event.file),
      notionId: event.notionId,
    }
    const links = Object.entries(event.roles).flatMap(([role, names]) =>
      (names ?? []).map((name, sortOrder) => ({
        institutionId: institutionIds.get(name)!,
        role: role as 'host' | 'organizer' | 'sponsor' | 'partner',
        sortOrder,
      })),
    )

    let businessId: number
    if (existing) {
      matched.add(existing.id)
      // 슬러그·노션 ID·본문·요약 중 하나라도 있으면 이미 옮겼거나 관리자가 채운 행사다.
      const untouched =
        !existing.slug &&
        !existing.notionId &&
        existing.content === '' &&
        !existing.summary
      if (!untouched && !force) {
        log(`행사 건너뜀(이미 채워짐): ${existing.name} #${existing.id}`)
        businessId = existing.id
      } else {
        log(`행사 채움: ${existing.name} #${existing.id} ← ${event.name}`)
        if (!dryRun) {
          await prisma.business.update({
            where: { id: existing.id },
            data: { ...data, institutions: { deleteMany: {}, create: links } },
          })
        }
        businessId = existing.id
      }
    } else {
      log(`행사 추가: ${event.name}`)
      if (dryRun) continue
      const created = await prisma.business.create({
        data: {
          ...data,
          name: event.name,
          code: event.code,
          institutions: { create: links },
        },
      })
      businessId = created.id
    }

    for (const page of event.pages) {
      const current = dryRun
        ? null
        : await prisma.businessPage.findUnique({
            where: { businessId_path: { businessId, path: page.path } },
          })
      const pageData = {
        title: page.title,
        icon: iconOf(page.icon),
        coverImageId: page.cover ? (assetIds.get(page.cover) ?? null) : null,
        content: await readContent(page.file),
        notionId: page.notionId,
      }
      if (current && !force) continue
      if (dryRun) {
        log(`  하위 페이지: ${event.slug}/${page.path}`)
        continue
      }
      if (current) {
        await prisma.businessPage.update({
          where: { id: current.id },
          data: pageData,
        })
      } else {
        await prisma.businessPage.create({
          data: { ...pageData, businessId, path: page.path },
        })
      }
    }
  }

  const unmatched = existingAll.filter((business) => !matched.has(business.id))
  if (unmatched.length > 0) {
    console.log(
      '\n노션 행사와 짝지어지지 않은 기존 사업(관리자 화면에서 분류·슬러그를 확인하세요):',
    )
    for (const business of unmatched) {
      console.log(`  #${business.id} ${business.name} (코드 ${business.code})`)
    }
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

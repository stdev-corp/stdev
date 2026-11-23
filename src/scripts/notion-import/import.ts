/*
 * content/ 묶음을 DB와 S3에 넣는다. 노션·Oopy를 지우기 전에 한 번 실행한다.
 *
 *   pnpm notion:import --env-file .env --dry-run   # 계획만 출력
 *   pnpm notion:import --env-file .env             # 실제로 넣기
 *
 * - 이미지·파일은 노션(또는 assets/)에서 내려받아 S3의 images/notion-…, files/notion-…
 *   에 올리고 ImageAsset/FileAsset 행을 만든다. 키가 원본 주소로 정해지므로 다시
 *   실행해도 같은 객체를 덮어쓸 뿐 늘어나지 않는다.
 * - 기관은 국문명이 같거나 mapping.ts의 INSTITUTION_ALIASES로 짝지은 기존 기관을 그대로
 *   쓰고, 없으면 홈 노출을 끈 채로 만든다.
 * - 행사는 슬러그 → 노션 ID → 코드 → 이름 순으로 기존 사업을 찾는다. 기존 사업이
 *   아직 행사 내용이 없으면(슬러그·노션 ID·본문·요약이 모두 비어 있으면) 노션 내용으로
 *   채우되 이름과 코드는 바꾸지 않는다. 이미 채워진 행사와 하위 페이지는 --force가 없으면 건드리지
 *   않으므로, 관리자 화면에서 고친 내용을 덮어쓰지 않는다.
 * - 구역 소개 마크다운은 해당 유형이 하나도 없을 때만 만든다.
 * - webpages.ts의 뉴스 기사·참여후기는 행사에 연결해 넣는다. 같은 주소가 이미 있으면
 *   --force가 없는 한 건너뛴다.
 * - 자산을 먼저 옮긴다. 원본이 사라진 것(403/404/410)만 경고하고 본문에서 빼며, 그 밖의
 *   실패는 기관·행사를 저장하기 전에 멈춘다. 행사와 하위 페이지는 한 트랜잭션으로 저장한다.
 */
import './network'
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
  const { INSTITUTION_ALIASES } = await import('./mapping')
  const { WEBPAGES, WEBPAGE_LABELS } = await import('./webpages')
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
  /**
   * 원본이 사라져 내려받을 수 없는 자산(노션에서도 깨져 보이는 외부 이미지 등).
   * 이것만 경고하고 본문에서 빼며, 그 밖의 실패(S3 업로드, DB, 네트워크, 노션 API
   * 일시 오류)는 내용을 저장하기 전에 가져오기를 멈춘다.
   */
  class SourceGoneError extends Error {}
  const GONE_STATUSES = [403, 404, 410]

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
      if (!url) {
        throw new SourceGoneError(`${asset.key} 노션이 파일 주소를 주지 않음`)
      }
    }
    const response = await fetch(url, {
      headers: { 'user-agent': 'curl/8.7.1' },
    })
    if (!response.ok) {
      const message = `${asset.key} 내려받기 실패 ${response.status}: ${url}`
      throw GONE_STATUSES.includes(response.status)
        ? new SourceGoneError(message)
        : new Error(message)
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

  /** 보관 파일의 형식. 대부분 PDF이고 보도자료 원문은 한글(HWP) 파일이다. */
  const FILE_TYPES: Record<string, string> = {
    pdf: 'application/pdf',
    hwp: 'application/x-hwp',
    hwpx: 'application/hwp+zip',
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
          ? (FILE_TYPES[extension] ?? 'application/octet-stream')
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

  // 노션에서도 이미 깨진 외부 이미지(원본이 403/404/410)는 경고하고 뺀다. 그 밖의
  // 실패는 기관·행사를 저장하기 전에 멈춘다. 자산을 뺀 채로 저장하면 다음 실행이
  // 그 행사를 '이미 채워짐'으로 건너뛰어, 원인을 고쳐도 자산이 돌아오지 않는다.
  const failed = new Set<string>()
  const queue = [...bundle.assets]
  let fatal: { asset: AssetRef; error: unknown } | null = null
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length > 0 && !fatal) {
      const asset = queue.shift()!
      try {
        await uploadAsset(asset)
      } catch (error) {
        if (!(error instanceof SourceGoneError)) {
          fatal ??= { asset, error }
          return
        }
        failed.add(asset.key)
        console.warn(
          `경고: 원본이 없어 자산을 본문에서 뺍니다 (${asset.key} ${asset.filename}):`,
          error.message.slice(0, 160),
        )
      }
    }
  })
  await Promise.all(workers)
  if (fatal) {
    const { asset, error } = fatal as { asset: AssetRef; error: unknown }
    throw new Error(
      `자산 ${asset.key} (${asset.filename})을 옮기지 못해 아무 내용도 저장하지 않고 멈춥니다. 원인을 고친 뒤 다시 실행하세요.`,
      { cause: error },
    )
  }

  function fill(markdown: string) {
    let out = markdown
    for (const key of failed) {
      const ref = `${ASSET_SCHEME}${key}`
      out = out
        .split('\n')
        // 컨테이너(:::callout 등)는 아이콘 속성만 떼고, 한 줄 블록(::image, ::video)은
        // 줄을 통째로 뺀다. 컨테이너 여는 줄을 지우면 닫는 :::가 글자로 남는다.
        .flatMap((line) => {
          if (!line.includes(ref)) return [line]
          if (/^\s*:{3,}/.test(line)) {
            return [line.replace(new RegExp(`\\s*[a-z-]+="${ref}"`, 'g'), '')]
          }
          return line.trim().startsWith('::') ? [] : [line]
        })
        .join('\n')
        .replace(
          // 갤러리 카드 표지는 ![이름](주소 "cover:N%")처럼 제목이 붙을 수 있다.
          new RegExp(
            `!\\[[^\\]]*\\]\\(${ref}(?: "[^"]*")?\\)(\\\\\\n\\s*)?`,
            'g',
          ),
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
    // 노션 이름이 없으면 운영 DB에서 쓰는 이름(INSTITUTION_ALIASES)으로 찾는다.
    const alias = INSTITUTION_ALIASES[institution.nameKo]
    const existing =
      (await prisma.institution.findUnique({
        where: { nameKo: institution.nameKo },
      })) ??
      (alias
        ? await prisma.institution.findUnique({ where: { nameKo: alias } })
        : null)
    if (existing) {
      institutionIds.set(institution.nameKo, existing.id)
      if (existing.nameKo !== institution.nameKo) {
        log(`기관 연결: ${institution.nameKo} → 기존 ${existing.nameKo}`)
      }
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
  /**
   * 묶음의 행사 슬러그 → 찾았거나 만든 사업 ID. 관리자가 슬러그를 바꿔도 노션 ID 등으로
   * 찾은 같은 행사를 가리킨다. --dry-run에서 새로 만들 행사는 null이다.
   */
  const eventIds = new Map<string, number | null>()
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

    if (event.slug) eventIds.set(event.slug, existing?.id ?? null)
    if (existing) {
      matched.add(existing.id)
      // 슬러그·노션 ID·본문·요약 중 하나라도 있으면 이미 옮겼거나 관리자가 채운 행사다.
      // 이런 행사는 하위 페이지도 건드리지 않는다(관리자가 지우거나 옮긴 페이지를
      // 되살리지 않도록).
      const untouched =
        !existing.slug &&
        !existing.notionId &&
        existing.content === '' &&
        !existing.summary
      if (!untouched && !force) {
        log(`행사 건너뜀(이미 채워짐): ${existing.name} #${existing.id}`)
        continue
      }
      log(`행사 채움: ${existing.name} #${existing.id} ← ${event.name}`)
    } else {
      log(`행사 추가: ${event.name}`)
    }

    const pages: {
      currentId: number | null
      path: string
      data: {
        title: string
        icon: string | null
        coverImageId: number | null
        content: string
        notionId: string
      }
    }[] = []
    for (const page of event.pages) {
      // 노션 ID로 먼저 찾는다. 관리자가 경로를 바꿔도 같은 페이지로 알아본다.
      const current =
        (await prisma.businessPage.findUnique({
          where: { notionId: page.notionId },
        })) ??
        (existing
          ? await prisma.businessPage.findUnique({
              where: {
                businessId_path: { businessId: existing.id, path: page.path },
              },
            })
          : null)
      if (current && !force) continue
      log(
        `  하위 페이지 ${current ? '갱신' : '추가'}: ${event.slug}/${page.path}`,
      )
      if (dryRun) continue
      pages.push({
        currentId: current?.id ?? null,
        path: page.path,
        data: {
          title: page.title,
          icon: iconOf(page.icon),
          coverImageId: page.cover ? (assetIds.get(page.cover) ?? null) : null,
          content: await readContent(page.file),
          notionId: page.notionId,
        },
      })
    }
    if (dryRun) continue

    // 행사와 하위 페이지를 한 번에 저장한다. 중간에 멈춰 행사만 저장되면 다음 실행이
    // 그 행사를 '이미 채워짐'으로 보고 남은 하위 페이지를 건너뛰기 때문이다.
    const savedId = await prisma.$transaction(
      async (tx) => {
        const { id: businessId } = existing
          ? await tx.business.update({
              where: { id: existing.id },
              data: {
                ...data,
                institutions: { deleteMany: {}, create: links },
              },
            })
          : await tx.business.create({
              data: {
                ...data,
                name: event.name,
                code: event.code,
                institutions: { create: links },
              },
            })
        for (const page of pages) {
          if (page.currentId) {
            await tx.businessPage.update({
              where: { id: page.currentId },
              data: page.data,
            })
          } else {
            await tx.businessPage.create({
              data: { ...page.data, businessId, path: page.path },
            })
          }
        }
        return businessId
      },
      { timeout: 60_000 },
    )
    if (event.slug) eventIds.set(event.slug, savedId)
  }

  /* ---------------------------------------------------------------- *
   * 뉴스 기사·참여후기
   * ---------------------------------------------------------------- */
  // 행사 하위 페이지에 있던 기사·후기 링크를 구역 목록(/hackathon/news 등)에도 올린다.
  // 같은 주소가 이미 있으면 --force가 없는 한 건너뛰어, 관리자가 고친 내용을 덮어쓰지 않는다.
  // 행사는 위에서 찾은 ID로 잇는다. 지금 DB 슬러그로 찾으면 관리자가 슬러그를 바꾼
  // 행사를 놓친다.
  for (const webpage of WEBPAGES) {
    if (!eventIds.has(webpage.event)) {
      throw new Error(
        `${webpage.url}을 연결할 행사(${webpage.event})가 가져오기 묶음에 없습니다.`,
      )
    }
    const current = await prisma.webpage.findUnique({
      where: { url: webpage.url },
    })
    if (current && !force) continue
    log(
      `${WEBPAGE_LABELS[webpage.type]} ${current ? '갱신' : '추가'}: ${webpage.event} ${webpage.title}`,
    )
    if (dryRun) continue
    // 실제 실행에서는 행사를 모두 찾거나 만들었으므로 null이 남지 않는다.
    const businessId = eventIds.get(webpage.event)
    if (!businessId) {
      throw new Error(`행사(${webpage.event})의 ID를 알 수 없습니다.`)
    }
    const data = {
      title: webpage.title,
      author: webpage.author,
      // 관리자 화면처럼 날짜만 받은 값을 UTC 자정으로 둔다(한국 시간으로 같은 날).
      publishedDate: new Date(webpage.publishedDate),
      type: webpage.type,
      businessId,
    }
    if (current) {
      await prisma.webpage.update({ where: { id: current.id }, data })
    } else {
      await prisma.webpage.create({ data: { ...data, url: webpage.url } })
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

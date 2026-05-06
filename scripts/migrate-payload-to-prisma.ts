import 'dotenv/config'
import type { PrismaClient, Prisma } from '@prisma/client'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Client } from 'pg'
import {
  isAllowedImageUrl,
  isSafePdfUrl,
  isSafeHttpsUrl,
} from '../src/utils/public-url'

const sourceUrl = process.env.PAYLOAD_DATABASE_URL ?? process.env.DATABASE_URL
const sourceSslRejectUnauthorized =
  process.env.PAYLOAD_DATABASE_SSL_REJECT_UNAUTHORIZED === 'false'
    ? false
    : true
const write = process.argv.includes('--write')
const s3BaseUrl =
  process.env.PAYLOAD_S3_BASE_URL ??
  'https://stdev-kr.s3.ap-northeast-2.amazonaws.com'
const s3Region = process.env.AWS_REGION ?? 'ap-northeast-2'
const sourceBucket =
  process.env.PAYLOAD_S3_SOURCE_BUCKET ?? new URL(s3BaseUrl).hostname.split('.')[0]
const targetBucket = process.env.PAYLOAD_S3_TARGET_BUCKET ?? sourceBucket
const copyS3Objects = process.argv.includes('--copy-s3')
let targetPrisma: PrismaClient | null = null
let s3Client: S3Client | null = null
const copiedS3Keys: string[] = []
let databaseCommitted = false

type Row = Record<string, unknown>

function asString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function asNumber(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value)
  }

  return null
}

function asDate(value: unknown) {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value)
  }

  return null
}

function firstValue(row: Row, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined) {
      return row[key]
    }
  }

  return undefined
}

function requireString(row: Row, ...keys: string[]) {
  const value = asString(firstValue(row, ...keys))
  if (!value) {
    throw new Error(`Missing required string column ${keys.join(' or ')}`)
  }
  return value
}

function requireDate(row: Row, ...keys: string[]) {
  const value = asDate(firstValue(row, ...keys))
  if (!value) {
    throw new Error(`Missing required date column ${keys.join(' or ')}`)
  }
  return value
}

function relationId(row: Row, ...keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key])
    if (value) {
      return value
    }
  }

  return null
}

function markdownType(value: string): 'articles' | 'privacy' | 'terms' {
  if (value === 'articles' || value === 'privacy' || value === 'terms') {
    return value
  }

  throw new Error(`Unsupported markdown type ${value}`)
}

function reportType(value: string): 'meeting' | 'donation' {
  if (value === 'meeting' || value === 'donation') {
    return value
  }

  throw new Error(`Unsupported report type ${value}`)
}

function webpageType(
  value: string,
): 'blog_post' | 'news_article' | 'press_release' {
  if (
    value === 'blog_post' ||
    value === 'news_article' ||
    value === 'press_release'
  ) {
    return value
  }

  throw new Error(`Unsupported webpage type ${value}`)
}

function assetUrl(row: Row, defaultPrefix: 'images' | 'files') {
  const storedUrl = asString(row.url)
  if (storedUrl) {
    return storedUrl
  }

  const filename = asString(row.filename)
  if (!filename) {
    return null
  }

  const prefix = asString(row.prefix) ?? defaultPrefix
  return `${s3BaseUrl}/${prefix}/${filename}`
}

async function migrateS3Object(row: Row, defaultPrefix: 'images' | 'files') {
  const filename = asString(row.filename)
  if (!filename) {
    return assetUrl(row, defaultPrefix)
  }

  const prefix = asString(row.prefix) ?? defaultPrefix

  if (!copyS3Objects) {
    return assetUrl(row, defaultPrefix)
  }

  if (sourceBucket === targetBucket) {
    return `https://${targetBucket}.s3.${s3Region}.amazonaws.com/${prefix}/${filename}`
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: s3Region,
      credentials:
        process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY,
              secretAccessKey: process.env.AWS_SECRET_KEY,
            }
          : undefined,
    })
  }

  await s3Client.send(
    new CopyObjectCommand({
      Bucket: targetBucket,
      CopySource: encodeURI(`${sourceBucket}/${prefix}/${filename}`),
      Key: `${prefix}/${filename}`,
    }),
  )

  copiedS3Keys.push(`${prefix}/${filename}`)

  return `https://${targetBucket}.s3.${s3Region}.amazonaws.com/${prefix}/${filename}`
}

function timestamps(row: Row) {
  return {
    createdAt: asDate(firstValue(row, 'createdAt', 'created_at')) ?? undefined,
    updatedAt: asDate(firstValue(row, 'updatedAt', 'updated_at')) ?? undefined,
  }
}

function validatedImageUrl(url: string | null, context: string) {
  if (!url) {
    return null
  }

  if (!isAllowedImageUrl(url)) {
    throw new Error(
      `${context} contains an image URL that the public site will not render: ${url}`,
    )
  }

  return url
}

function validatedHttpsUrl(url: string | null, context: string) {
  if (!url) {
    return null
  }

  if (!isSafeHttpsUrl(url)) {
    throw new Error(
      `${context} contains a URL that the public site will not render safely: ${url}`,
    )
  }

  return url
}

function validatedPdfUrl(url: string | null, context: string) {
  if (!url) {
    return null
  }

  if (!isSafePdfUrl(url)) {
    throw new Error(
      `${context} contains a file URL that is not a safe HTTPS PDF: ${url}`,
    )
  }

  return url
}

async function rollbackCopiedS3Objects() {
  if (databaseCommitted || !copyS3Objects || copiedS3Keys.length === 0) {
    return
  }

  if (!s3Client) {
    return
  }

  await Promise.all(
    copiedS3Keys.map((key) =>
      s3Client!.send(
        new DeleteObjectCommand({
          Bucket: targetBucket,
          Key: key,
        }),
      ),
    ),
  )
}

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

async function resetSerialSequence(
  target: PrismaExecutor,
  table: string,
  column = 'id',
) {
  await target.$executeRawUnsafe(
    `select setval(pg_get_serial_sequence('"${table}"', '${column}'), coalesce((select max("${column}") from "${table}"), 1), true)`,
  )
}

async function targetCounts(target: PrismaExecutor) {
  const [
    businesses,
    images,
    files,
    institutions,
    markdowns,
    webpages,
    reports,
    histories,
  ] = await Promise.all([
    target.business.count(),
    target.imageAsset.count(),
    target.fileAsset.count(),
    target.institution.count(),
    target.markdown.count(),
    target.webpage.count(),
    target.report.count(),
    target.history.count(),
  ])

  return {
    businesses,
    images,
    files,
    institutions,
    markdowns,
    webpages,
    reports,
    histories,
  }
}

async function targetIds(target: PrismaExecutor) {
  const [
    businesses,
    images,
    files,
    institutions,
    markdowns,
    webpages,
    reports,
    histories,
  ] = await Promise.all([
    target.business.findMany({ select: { id: true } }),
    target.imageAsset.findMany({ select: { id: true } }),
    target.fileAsset.findMany({ select: { id: true } }),
    target.institution.findMany({ select: { id: true } }),
    target.markdown.findMany({ select: { id: true } }),
    target.webpage.findMany({ select: { id: true } }),
    target.report.findMany({ select: { id: true } }),
    target.history.findMany({ select: { id: true } }),
  ])

  return {
    businesses: new Set(businesses.map((row) => row.id)),
    images: new Set(images.map((row) => row.id)),
    files: new Set(files.map((row) => row.id)),
    institutions: new Set(institutions.map((row) => row.id)),
    markdowns: new Set(markdowns.map((row) => row.id)),
    webpages: new Set(webpages.map((row) => row.id)),
    reports: new Set(reports.map((row) => row.id)),
    histories: new Set(histories.map((row) => row.id)),
  }
}

function sourceIds(rows: Row[]) {
  return rows
    .map((row) => asNumber(row.id))
    .filter((id): id is number => id !== null)
}

async function tableExists(client: Client, table: string) {
  const result = await client.query<{ exists: boolean }>(
    `select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = $1
    )`,
    [table],
  )

  return result.rows[0]?.exists ?? false
}

async function rows(client: Client, table: string) {
  const exists = await tableExists(client, table)
  if (!exists) {
    return {
      exists: false,
      rows: [] as Row[],
    }
  }

  const result = await client.query<Row>(`select * from "${table}" order by id asc`)
  return {
    exists: true,
    rows: result.rows,
  }
}

async function prisma() {
  if (!targetPrisma) {
    const prismaModule = await import('../src/utils/prisma')
    targetPrisma = prismaModule.prisma
  }

  return targetPrisma
}

async function disconnectPrisma() {
  if (targetPrisma) {
    await targetPrisma.$disconnect()
    targetPrisma = null
  }
}

async function main() {
  if (!sourceUrl) {
    throw new Error('DATABASE_URL or PAYLOAD_DATABASE_URL is required')
  }

  const source = new Client({
    connectionString: sourceUrl,
    connectionTimeoutMillis: 10_000,
    ssl: {
      rejectUnauthorized: sourceSslRejectUnauthorized,
    },
  })

  await source.connect()

  const businessesResult = await rows(source, 'businesses')
  const imagesResult = await rows(source, 'images')
  const filesResult = await rows(source, 'files')
  const institutionsResult = await rows(source, 'institutions')
  const markdownsResult = await rows(source, 'markdowns')
  const webpagesResult = await rows(source, 'webpages')
  const reportsResult = await rows(source, 'reports')
  const historiesResult = await rows(source, 'histories')

  const missingTables = [
    ['businesses', businessesResult.exists],
    ['images', imagesResult.exists],
    ['files', filesResult.exists],
    ['institutions', institutionsResult.exists],
    ['markdowns', markdownsResult.exists],
    ['webpages', webpagesResult.exists],
    ['reports', reportsResult.exists],
    ['histories', historiesResult.exists],
  ]
    .filter(([, exists]) => !exists)
    .map(([table]) => table)

  if (missingTables.length > 0) {
    throw new Error(
      `Source database is missing required Payload tables: ${missingTables.join(', ')}. Check PAYLOAD_DATABASE_URL and confirm the legacy schema still exists.`,
    )
  }

  const businesses = businessesResult.rows
  const images = imagesResult.rows
  const files = filesResult.rows
  const institutions = institutionsResult.rows
  const markdowns = markdownsResult.rows
  const webpages = webpagesResult.rows
  const reports = reportsResult.rows
  const histories = historiesResult.rows

  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        sourceTables: {
          businesses: businesses.length,
          images: images.length,
          files: files.length,
          institutions: institutions.length,
          markdowns: markdowns.length,
          webpages: webpages.length,
          reports: reports.length,
          histories: histories.length,
        },
      },
      null,
      2,
    ),
  )

  const totalSourceRows = Object.values({
    businesses: businesses.length,
    images: images.length,
    files: files.length,
    institutions: institutions.length,
    markdowns: markdowns.length,
    webpages: webpages.length,
    reports: reports.length,
    histories: histories.length,
  }).reduce((sum, count) => sum + count, 0)

  if (totalSourceRows === 0) {
    throw new Error(
      'No source Payload rows were found. Check PAYLOAD_DATABASE_URL or verify the legacy tables still exist in the selected source database.',
    )
  }

  if (!write) {
    await source.end()
    return
  }

  const target = await prisma()

  await target.$transaction(async (tx) => {
  for (const business of businesses) {
    await tx.business.upsert({
      where: { id: asNumber(business.id) ?? 0 },
      update: {
        name: requireString(business, 'name'),
        code: requireString(business, 'code'),
        startDate: requireDate(business, 'startDate', 'start_date'),
        endDate: requireDate(business, 'endDate', 'end_date'),
        location: asString(business.location),
        ...timestamps(business),
      },
      create: {
        id: asNumber(business.id) ?? undefined,
        name: requireString(business, 'name'),
        code: requireString(business, 'code'),
        startDate: requireDate(business, 'startDate', 'start_date'),
        endDate: requireDate(business, 'endDate', 'end_date'),
        location: asString(business.location),
        ...timestamps(business),
      },
    })
  }

  for (const image of images) {
    await tx.imageAsset.upsert({
      where: { id: asNumber(image.id) ?? 0 },
      update: {
        alt: asString(image.alt),
        filename: asString(image.filename),
        url: validatedImageUrl(
          await migrateS3Object(image, 'images'),
          `images id=${image.id}`,
        ),
        mimeType: asString(firstValue(image, 'mimeType', 'mime_type')),
        filesize: asNumber(image.filesize),
        prefix: asString(image.prefix) ?? 'images',
        thumbnailURL: asString(
          firstValue(image, 'thumbnailURL', 'thumbnail_url'),
        ),
        width: asNumber(image.width),
        height: asNumber(image.height),
        focalX: asNumber(image.focalX),
        focalY: asNumber(image.focalY),
        ...timestamps(image),
      },
      create: {
        id: asNumber(image.id) ?? undefined,
        alt: asString(image.alt),
        filename: asString(image.filename),
        url: validatedImageUrl(
          await migrateS3Object(image, 'images'),
          `images id=${image.id}`,
        ),
        mimeType: asString(firstValue(image, 'mimeType', 'mime_type')),
        filesize: asNumber(image.filesize),
        prefix: asString(image.prefix) ?? 'images',
        thumbnailURL: asString(
          firstValue(image, 'thumbnailURL', 'thumbnail_url'),
        ),
        width: asNumber(image.width),
        height: asNumber(image.height),
        focalX: asNumber(image.focalX),
        focalY: asNumber(image.focalY),
        ...timestamps(image),
      },
    })
  }

  for (const file of files) {
    await tx.fileAsset.upsert({
      where: { id: asNumber(file.id) ?? 0 },
      update: {
        filename: requireString(file, 'filename'),
        url: validatedPdfUrl(
          await migrateS3Object(file, 'files'),
          `files id=${file.id}`,
        ),
        mimeType: asString(firstValue(file, 'mimeType', 'mime_type')),
        filesize: asNumber(file.filesize),
        prefix: asString(file.prefix) ?? 'files',
        thumbnailURL: asString(
          firstValue(file, 'thumbnailURL', 'thumbnail_url'),
        ),
        width: asNumber(file.width),
        height: asNumber(file.height),
        focalX: asNumber(file.focalX),
        focalY: asNumber(file.focalY),
        ...timestamps(file),
      },
      create: {
        id: asNumber(file.id) ?? undefined,
        filename: requireString(file, 'filename'),
        url: validatedPdfUrl(
          await migrateS3Object(file, 'files'),
          `files id=${file.id}`,
        ),
        mimeType: asString(firstValue(file, 'mimeType', 'mime_type')),
        filesize: asNumber(file.filesize),
        prefix: asString(file.prefix) ?? 'files',
        thumbnailURL: asString(
          firstValue(file, 'thumbnailURL', 'thumbnail_url'),
        ),
        width: asNumber(file.width),
        height: asNumber(file.height),
        focalX: asNumber(file.focalX),
        focalY: asNumber(file.focalY),
        ...timestamps(file),
      },
    })
  }

  for (const institution of institutions) {
    const logoId = relationId(institution, 'logo', 'logo_id', 'logoId')
    if (!logoId) {
      throw new Error(`Missing logo relation for institution ${institution.id}`)
    }

    await tx.institution.upsert({
      where: { id: asNumber(institution.id) ?? 0 },
      update: {
        nameKo: requireString(institution, 'name_ko', 'nameKo'),
        nameEn: requireString(institution, 'name_en', 'nameEn'),
        url: validatedHttpsUrl(
          requireString(institution, 'url'),
          `institutions id=${institution.id}`,
        )!,
        logoId,
        ...timestamps(institution),
      },
      create: {
        id: asNumber(institution.id) ?? undefined,
        nameKo: requireString(institution, 'name_ko', 'nameKo'),
        nameEn: requireString(institution, 'name_en', 'nameEn'),
        url: validatedHttpsUrl(
          requireString(institution, 'url'),
          `institutions id=${institution.id}`,
        )!,
        logoId,
        ...timestamps(institution),
      },
    })
  }

  for (const markdown of markdowns) {
    await tx.markdown.upsert({
      where: { id: asNumber(markdown.id) ?? 0 },
      update: {
        type: markdownType(requireString(markdown, 'type')),
        revisionDate: requireDate(markdown, 'revisionDate', 'revision_date'),
        effectiveDate: requireDate(markdown, 'effectiveDate', 'effective_date'),
        content: requireString(markdown, 'content'),
        ...timestamps(markdown),
      },
      create: {
        id: asNumber(markdown.id) ?? undefined,
        type: markdownType(requireString(markdown, 'type')),
        revisionDate: requireDate(markdown, 'revisionDate', 'revision_date'),
        effectiveDate: requireDate(markdown, 'effectiveDate', 'effective_date'),
        content: requireString(markdown, 'content'),
        ...timestamps(markdown),
      },
    })
  }

  for (const webpage of webpages) {
    await tx.webpage.upsert({
      where: { id: asNumber(webpage.id) ?? 0 },
      update: {
        url: validatedHttpsUrl(
          requireString(webpage, 'url'),
          `webpages id=${webpage.id}`,
        )!,
        title: requireString(webpage, 'title'),
        author: requireString(webpage, 'author'),
        publishedDate: requireDate(webpage, 'publishedDate', 'published_date'),
        businessId: relationId(
          webpage,
          'business',
          'business_id',
          'businessId',
        ),
        type: webpageType(requireString(webpage, 'type')),
        ...timestamps(webpage),
      },
      create: {
        id: asNumber(webpage.id) ?? undefined,
        url: validatedHttpsUrl(
          requireString(webpage, 'url'),
          `webpages id=${webpage.id}`,
        )!,
        title: requireString(webpage, 'title'),
        author: requireString(webpage, 'author'),
        publishedDate: requireDate(webpage, 'publishedDate', 'published_date'),
        businessId: relationId(
          webpage,
          'business',
          'business_id',
          'businessId',
        ),
        type: webpageType(requireString(webpage, 'type')),
        ...timestamps(webpage),
      },
    })
  }

  for (const report of reports) {
    const fileId = relationId(report, 'file', 'file_id', 'fileId')
    if (!fileId) {
      throw new Error(`Missing file relation for report ${report.id}`)
    }

    await tx.report.upsert({
      where: { id: asNumber(report.id) ?? 0 },
      update: {
        title: requireString(report, 'title'),
        publishedDate: requireDate(report, 'publishedDate', 'published_date'),
        type: reportType(requireString(report, 'type')),
        fileId,
        ...timestamps(report),
      },
      create: {
        id: asNumber(report.id) ?? undefined,
        title: requireString(report, 'title'),
        publishedDate: requireDate(report, 'publishedDate', 'published_date'),
        type: reportType(requireString(report, 'type')),
        fileId,
        ...timestamps(report),
      },
    })
  }

  for (const history of histories) {
    await tx.history.upsert({
      where: { id: asNumber(history.id) ?? 0 },
      update: {
        date: requireDate(history, 'date'),
        title: requireString(history, 'title'),
        content: asString(history.content),
        imageId: relationId(history, 'image', 'image_id', 'imageId'),
        ...timestamps(history),
      },
      create: {
        id: asNumber(history.id) ?? undefined,
        date: requireDate(history, 'date'),
        title: requireString(history, 'title'),
        content: asString(history.content),
        imageId: relationId(history, 'image', 'image_id', 'imageId'),
        ...timestamps(history),
      },
    })
  }

  await resetSerialSequence(tx, 'Business')
  await resetSerialSequence(tx, 'ImageAsset')
  await resetSerialSequence(tx, 'FileAsset')
  await resetSerialSequence(tx, 'Institution')
  await resetSerialSequence(tx, 'Markdown')
  await resetSerialSequence(tx, 'Webpage')
  await resetSerialSequence(tx, 'Report')
  await resetSerialSequence(tx, 'History')
  }, {
    timeout: 60_000,
  })

  databaseCommitted = true

  const sourceCounts = {
    businesses: businesses.length,
    images: images.length,
    files: files.length,
    institutions: institutions.length,
    markdowns: markdowns.length,
    webpages: webpages.length,
    reports: reports.length,
    histories: histories.length,
  }
  const counts = await targetCounts(target)
  const ids = await targetIds(target)

  console.log(
    JSON.stringify(
      {
        mode: 'write',
        sourceTables: sourceCounts,
        targetTables: counts,
      },
      null,
      2,
    ),
  )

  for (const [table, sourceCount] of Object.entries(sourceCounts)) {
    const targetCount = counts[table as keyof typeof counts]
    if (targetCount < sourceCount) {
      throw new Error(
        `Target count mismatch for ${table}: source=${sourceCount}, target=${targetCount}`,
      )
    }
  }

  const sourceIdMap = {
    businesses: sourceIds(businesses),
    images: sourceIds(images),
    files: sourceIds(files),
    institutions: sourceIds(institutions),
    markdowns: sourceIds(markdowns),
    webpages: sourceIds(webpages),
    reports: sourceIds(reports),
    histories: sourceIds(histories),
  }

  for (const [table, idList] of Object.entries(sourceIdMap)) {
    const targetIdSet = ids[table as keyof typeof ids]
    for (const sourceId of idList) {
      if (!targetIdSet.has(sourceId)) {
        throw new Error(`Target is missing ${table} id=${sourceId}`)
      }
    }
  }

  await source.end()
  await disconnectPrisma()
  console.log('Payload asset/core table migration completed.')
}

main().catch(async (error: unknown) => {
  console.error(error)
  await rollbackCopiedS3Objects()
  await disconnectPrisma()
  process.exit(1)
})

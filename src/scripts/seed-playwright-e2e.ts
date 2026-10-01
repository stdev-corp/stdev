import { config } from 'dotenv'
import {
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import sharp from 'sharp'

config({ path: '.env.test' })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed Playwright E2E data')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const now = new Date('2026-01-01T00:00:00.000Z')

// Seeded assets keep the bucket's real address, the form uploadAsset stores.
// Pages fetch them through S3_PUBLIC_BASE_URL, which .env.test points at the
// S3 sidecar, so seedSidecarObjects puts a matching object behind each one.
const assetOrigin = 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com'
const logo = {
  url: `${assetOrigin}/images/e2e-logo.png`,
  width: 200,
  height: 80,
}
const historyImage = {
  url: `${assetOrigin}/images/e2e-history.png`,
  width: 640,
  height: 360,
}
const meetingFileUrl = `${assetOrigin}/files/e2e-meeting.pdf`
const donationFileUrl = `${assetOrigin}/files/e2e-donation.pdf`

async function resetDatabase() {
  await prisma.$transaction([
    prisma.webpage.deleteMany(),
    prisma.report.deleteMany(),
    prisma.history.deleteMany(),
    prisma.institution.deleteMany(),
    prisma.imageAsset.deleteMany(),
    prisma.fileAsset.deleteMany(),
    prisma.markdown.deleteMany(),
    prisma.business.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
  ])
}

async function seedDatabase() {
  const business = await prisma.business.create({
    data: {
      name: 'E2E 해커톤',
      code: 'e2e-hackathon',
      startDate: now,
      endDate: new Date('2026-01-02T00:00:00.000Z'),
      location: '서울',
    },
  })

  const logoAsset = await prisma.imageAsset.create({
    data: {
      alt: 'E2E 협력 기관 로고',
      filename: 'e2e-logo.png',
      url: logo.url,
      mimeType: 'image/png',
      filesize: 1024,
      width: logo.width,
      height: logo.height,
    },
  })

  const historyImageAsset = await prisma.imageAsset.create({
    data: {
      alt: 'E2E 연혁 이미지',
      filename: 'e2e-history.png',
      url: historyImage.url,
      mimeType: 'image/png',
      filesize: 2048,
      width: historyImage.width,
      height: historyImage.height,
    },
  })

  const meetingFile = await prisma.fileAsset.create({
    data: {
      filename: 'e2e-meeting.pdf',
      url: meetingFileUrl,
      mimeType: 'application/pdf',
      filesize: 4096,
    },
  })

  const donationFile = await prisma.fileAsset.create({
    data: {
      filename: 'e2e-donation.pdf',
      url: donationFileUrl,
      mimeType: 'application/pdf',
      filesize: 4096,
    },
  })

  await prisma.institution.create({
    data: {
      nameKo: 'E2E 협력 기관',
      nameEn: 'E2E Partner',
      url: 'https://example.com/e2e-partner',
      logoId: logoAsset.id,
    },
  })

  await prisma.history.create({
    data: {
      date: now,
      title: 'E2E 테스트 연혁',
      content: 'Playwright 테스트용 더미 연혁입니다.',
      imageId: historyImageAsset.id,
    },
  })

  await prisma.markdown.createMany({
    data: [
      {
        type: 'articles',
        revisionDate: now,
        effectiveDate: now,
        content: '# E2E 정관\n\nPlaywright 테스트용 정관 문서입니다.',
      },
      {
        type: 'privacy',
        revisionDate: now,
        effectiveDate: now,
        content: '# E2E 개인정보처리방침\n\n테스트용 개인정보처리방침입니다.',
      },
      {
        type: 'terms',
        revisionDate: now,
        effectiveDate: now,
        content: '# E2E 이용약관\n\n테스트용 이용약관입니다.',
      },
    ],
  })

  await prisma.webpage.createMany({
    data: [
      {
        url: 'https://example.com/e2e-blog',
        title: 'E2E 블로그 글',
        author: 'STDev',
        publishedDate: now,
        businessId: business.id,
        type: 'blog_post',
      },
      {
        url: 'https://example.com/e2e-news',
        title: 'E2E 뉴스 기사',
        author: 'STDev',
        publishedDate: now,
        businessId: business.id,
        type: 'news_article',
      },
      {
        url: 'https://example.com/e2e-press',
        title: 'E2E 보도자료',
        author: 'STDev',
        publishedDate: now,
        businessId: business.id,
        type: 'press_release',
      },
    ],
  })

  await prisma.report.createMany({
    data: [
      {
        title: 'E2E 회의록',
        publishedDate: now,
        type: 'meeting',
        fileId: meetingFile.id,
      },
      {
        title: 'E2E 기부금 활용 실적',
        publishedDate: now,
        type: 'donation',
        fileId: donationFile.id,
      },
    ],
  })
}

async function seedSidecarObjects() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? ''
  const endpointHost = URL.canParse(endpoint) ? new URL(endpoint).hostname : ''

  if (!['127.0.0.1', 'localhost', '[::1]'].includes(endpointHost)) {
    throw new Error('AWS_ENDPOINT_URL_S3 must point at the local S3 sidecar')
  }

  const bucket = process.env.S3_BUCKET ?? 'stdev-kr'
  const client = new S3Client({
    region: process.env.AWS_REGION ?? 'ap-northeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY ?? '',
      secretAccessKey: process.env.AWS_SECRET_KEY ?? '',
    },
    endpoint,
    forcePathStyle: true,
  })

  // The real bucket serves objects to anonymous readers; next/image's
  // optimizer and the browser fetch the sidecar the same way.
  await client.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      }),
    }),
  )

  const png = ({ width, height }: { width: number; height: number }) =>
    sharp({ create: { width, height, channels: 3, background: '#256ef4' } })
      .png()
      .toBuffer()
  const pdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  )

  for (const { url, body, contentType } of [
    { url: logo.url, body: await png(logo), contentType: 'image/png' },
    {
      url: historyImage.url,
      body: await png(historyImage),
      contentType: 'image/png',
    },
    { url: meetingFileUrl, body: pdf, contentType: 'application/pdf' },
    { url: donationFileUrl, body: pdf, contentType: 'application/pdf' },
  ]) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: new URL(url).pathname.slice(1),
        Body: body,
        ContentType: contentType,
      }),
    )
  }
}

try {
  await resetDatabase()
  await seedDatabase()
  await seedSidecarObjects()
  console.log('Seeded Playwright E2E dummy data')
} finally {
  await prisma.$disconnect()
}

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
const newsArchiveUrl = `${assetOrigin}/files/e2e-news-archive.pdf`

async function resetDatabase() {
  await prisma.$transaction([
    // 행사와 하위 페이지가 이미지(커버)와 기관을 가리키므로 그쪽을 먼저 지운다.
    prisma.webpage.deleteMany(),
    prisma.businessInstitution.deleteMany(),
    prisma.businessPage.deleteMany(),
    prisma.business.deleteMany(),
    prisma.report.deleteMany(),
    prisma.history.deleteMany(),
    prisma.institution.deleteMany(),
    prisma.imageAsset.deleteMany(),
    prisma.fileAsset.deleteMany(),
    prisma.markdown.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
  ])
}

async function seedDatabase() {
  // 노션에서 옮긴 행사 페이지와 같은 모양의 행사. 본문은 노션 확장 마크다운이다.
  const business = await prisma.business.create({
    data: {
      name: 'E2E 해커톤',
      code: 'e2e-hackathon',
      slug: 'e2e-hackathon',
      category: 'hackathon',
      startDate: now,
      endDate: new Date('2026-01-02T00:00:00.000Z'),
      location: '서울',
      icon: '🚀',
      summary: 'E2E 해커톤 **요약**',
      notionId: '32d3ff07-ff5b-8001-ae54-c458f8571ea3',
      content: [
        ':::callout{icon="💡" color="gray_background"}',
        '**E2E 콜아웃**',
        ':::',
        '',
        '## E2E 일정',
        '',
        ':::toggle[E2E 토글 질문]',
        'E2E 토글 답변',
        ':::',
        '',
        '::page{path="faq"}',
      ].join('\n'),
    },
  })

  await prisma.businessPage.create({
    data: {
      businessId: business.id,
      path: 'faq',
      title: 'E2E 자주 묻는 질문',
      icon: '❓',
      content: 'E2E 하위 페이지 본문',
      notionId: '32d3ff07-ff5b-802e-9590-d11a59608612',
    },
  })

  // 목록 정렬(개최일 내림차순) 확인용 지난 행사와 컨퍼런스
  await prisma.business.createMany({
    data: [
      {
        name: 'E2E 지난 해커톤',
        code: 'e2e-old-hackathon',
        category: 'hackathon',
        startDate: new Date('2024-05-01T00:00:00.000Z'),
        endDate: new Date('2024-05-02T00:00:00.000Z'),
        location: '대전',
      },
      {
        name: 'E2E 컨퍼런스',
        code: 'e2e-conference',
        slug: 'e2e-conference',
        category: 'conference',
        startDate: new Date('2025-03-01T05:00:00.000Z'),
        endDate: new Date('2025-03-01T09:00:00.000Z'),
        hasTime: true,
        location: '서울',
        content: 'E2E 컨퍼런스 본문',
      },
    ],
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

  // 뉴스 기사의 원문 저장본(관리자 화면에서만 보이는 PDF 사본)
  const newsArchive = await prisma.fileAsset.create({
    data: {
      filename: 'e2e-news-archive.pdf',
      url: newsArchiveUrl,
      mimeType: 'application/pdf',
      filesize: 4096,
    },
  })

  const partner = await prisma.institution.create({
    data: {
      nameKo: 'E2E 협력 기관',
      nameEn: 'E2E Partner',
      url: 'https://example.com/e2e-partner',
      logoId: logoAsset.id,
    },
  })

  // 홈 로고 흐름에는 나오지 않는, 행사 후원으로만 등록한 기관
  const sponsor = await prisma.institution.create({
    data: { nameKo: 'E2E 후원사', showOnHome: false },
  })

  await prisma.businessInstitution.createMany({
    data: [
      { businessId: business.id, institutionId: partner.id, role: 'host' },
      { businessId: business.id, institutionId: sponsor.id, role: 'sponsor' },
    ],
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
      {
        type: 'hackathon',
        revisionDate: now,
        effectiveDate: now,
        content: 'E2E 해커톤 구역 소개',
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
        archiveId: newsArchive.id,
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
    { url: newsArchiveUrl, body: pdf, contentType: 'application/pdf' },
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

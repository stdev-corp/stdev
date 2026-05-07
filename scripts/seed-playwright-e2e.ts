import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed Playwright E2E data')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const now = new Date('2026-01-01T00:00:00.000Z')

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

  const logo = await prisma.imageAsset.create({
    data: {
      alt: 'E2E 협력 기관 로고',
      filename: 'e2e-logo.png',
      url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/e2e-logo.png',
      mimeType: 'image/png',
      filesize: 1024,
      width: 200,
      height: 80,
    },
  })

  const historyImage = await prisma.imageAsset.create({
    data: {
      alt: 'E2E 연혁 이미지',
      filename: 'e2e-history.png',
      url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/e2e-history.png',
      mimeType: 'image/png',
      filesize: 2048,
      width: 640,
      height: 360,
    },
  })

  const meetingFile = await prisma.fileAsset.create({
    data: {
      filename: 'e2e-meeting.pdf',
      url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/e2e-meeting.pdf',
      mimeType: 'application/pdf',
      filesize: 4096,
    },
  })

  const donationFile = await prisma.fileAsset.create({
    data: {
      filename: 'e2e-donation.pdf',
      url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/e2e-donation.pdf',
      mimeType: 'application/pdf',
      filesize: 4096,
    },
  })

  await prisma.institution.create({
    data: {
      nameKo: 'E2E 협력 기관',
      nameEn: 'E2E Partner',
      url: 'https://example.com/e2e-partner',
      logoId: logo.id,
    },
  })

  await prisma.history.create({
    data: {
      date: now,
      title: 'E2E 테스트 연혁',
      content: 'Playwright 테스트용 더미 연혁입니다.',
      imageId: historyImage.id,
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

try {
  await resetDatabase()
  await seedDatabase()
  console.log('Seeded Playwright E2E dummy data')
} finally {
  await prisma.$disconnect()
}

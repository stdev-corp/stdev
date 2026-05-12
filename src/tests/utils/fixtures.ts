import type {
  Business,
  FileAsset,
  History,
  ImageAsset,
  Institution,
  Markdown,
  Report,
  Webpage,
} from '@prisma/client'

const baseTimestamps = {
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
}

export function makeBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: 1,
    name: 'Hackathon 2026',
    code: 'hack-2026',
    startDate: new Date('2026-06-01T00:00:00Z'),
    endDate: new Date('2026-06-02T00:00:00Z'),
    location: 'Seoul',
    ...baseTimestamps,
    ...overrides,
  }
}

export function makeImageAsset(
  overrides: Partial<ImageAsset> = {},
): ImageAsset {
  return {
    id: 1,
    alt: 'Logo',
    filename: 'logo.png',
    url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo.png',
    mimeType: 'image/png',
    filesize: 1024,
    prefix: 'images',
    thumbnailURL: null,
    width: 200,
    height: 200,
    focalX: null,
    focalY: null,
    ...baseTimestamps,
    ...overrides,
  }
}

export function makeFileAsset(overrides: Partial<FileAsset> = {}): FileAsset {
  return {
    id: 1,
    filename: 'report.pdf',
    url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/report.pdf',
    mimeType: 'application/pdf',
    filesize: 2048,
    prefix: 'files',
    thumbnailURL: null,
    width: null,
    height: null,
    focalX: null,
    focalY: null,
    ...baseTimestamps,
    ...overrides,
  }
}

export function makeHistory(overrides: Partial<History> = {}): History {
  return {
    id: 1,
    date: new Date('2026-05-01T00:00:00Z'),
    title: '첫 이사회',
    content: '정관 채택',
    imageId: null,
    ...baseTimestamps,
    ...overrides,
  }
}

export function makeInstitution(
  overrides: Partial<Institution> = {},
): Institution {
  return {
    id: 1,
    nameKo: '기관명',
    nameEn: 'Institution',
    url: 'https://example.com',
    logoId: 1,
    ...baseTimestamps,
    ...overrides,
  }
}

export function makeMarkdown(overrides: Partial<Markdown> = {}): Markdown {
  return {
    id: 1,
    type: 'articles',
    revisionDate: new Date('2026-01-01T00:00:00Z'),
    effectiveDate: new Date('2026-01-10T00:00:00Z'),
    content: '# 정관\n\n본문',
    ...baseTimestamps,
    ...overrides,
  } as Markdown
}

export function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 1,
    title: '2026 1분기 회의록',
    publishedDate: new Date('2026-03-31T00:00:00Z'),
    type: 'meeting',
    fileId: 1,
    ...baseTimestamps,
    ...overrides,
  } as Report
}

export function makeWebpage(overrides: Partial<Webpage> = {}): Webpage {
  return {
    id: 1,
    url: 'https://blog.example.com/post',
    title: '블로그 글',
    author: '홍길동',
    publishedDate: new Date('2026-05-01T00:00:00Z'),
    businessId: null,
    type: 'blog_post',
    ...baseTimestamps,
    ...overrides,
  } as Webpage
}

export function makeWebpageWithBusiness(
  overrides: Partial<Webpage & { business: Business | null }> = {},
) {
  return {
    ...makeWebpage(overrides),
    business: overrides.business ?? null,
  }
}

export function makeReportWithFile(
  overrides: Partial<Report & { file: FileAsset }> = {},
) {
  return {
    ...makeReport(overrides),
    file: overrides.file ?? makeFileAsset(),
  }
}

export function makeHistoryWithImage(
  overrides: Partial<History & { image: ImageAsset | null }> = {},
) {
  return {
    ...makeHistory(overrides),
    image: overrides.image === undefined ? makeImageAsset() : overrides.image,
  }
}

export function makeInstitutionWithLogo(
  overrides: Partial<Institution & { logo: ImageAsset }> = {},
) {
  return {
    ...makeInstitution(overrides),
    logo: overrides.logo ?? makeImageAsset(),
  }
}

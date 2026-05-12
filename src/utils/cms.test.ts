import { beforeEach, describe, expect, it } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/tests/mocks/prisma'
import {
  makeBusiness,
  makeFileAsset,
  makeHistoryWithImage,
  makeImageAsset,
  makeInstitutionWithLogo,
  makeMarkdown,
  makeReportWithFile,
  makeWebpageWithBusiness,
} from '@/tests/utils/fixtures'
import {
  getLatestMarkdownByType,
  getMarkdownsByType,
  queryHistories,
  queryInstitutions,
  queryReports,
  queryWebpages,
} from '@/utils/cms'

const S3_HOST = 'stdev-kr.s3.ap-northeast-2.amazonaws.com'

beforeEach(() => {
  resetPrismaMock()
})

describe('queryInstitutions', () => {
  it('calls prisma.institution.findMany with logo include and id asc order', async () => {
    prismaMock.institution.findMany.mockResolvedValue([])
    await queryInstitutions()
    expect(prismaMock.institution.findMany).toHaveBeenCalledWith({
      include: { logo: true },
      orderBy: { id: 'asc' },
    })
  })

  it('returns mapped list of imageUrl/imageAlt when logo URL is allowed', async () => {
    prismaMock.institution.findMany.mockResolvedValue([
      makeInstitutionWithLogo({
        id: 1,
        logo: makeImageAsset({
          url: `https://${S3_HOST}/images/logo-a.png`,
          alt: 'A',
        }),
      }),
      makeInstitutionWithLogo({
        id: 2,
        logo: makeImageAsset({
          url: `https://${S3_HOST}/images/logo-b.png`,
          alt: 'B',
        }),
      }),
    ] as never)
    const result = await queryInstitutions()
    expect(result).toEqual([
      {
        imageUrl: `https://${S3_HOST}/images/logo-a.png`,
        imageAlt: 'A',
      },
      {
        imageUrl: `https://${S3_HOST}/images/logo-b.png`,
        imageAlt: 'B',
      },
    ])
  })

  it('drops institutions whose logo URL is http (not https)', async () => {
    prismaMock.institution.findMany.mockResolvedValue([
      makeInstitutionWithLogo({
        id: 1,
        logo: makeImageAsset({
          url: `http://${S3_HOST}/images/logo.png`,
          alt: 'Bad',
        }),
      }),
      makeInstitutionWithLogo({
        id: 2,
        logo: makeImageAsset({
          url: `https://${S3_HOST}/images/ok.png`,
          alt: 'OK',
        }),
      }),
    ] as never)
    const result = await queryInstitutions()
    expect(result).toEqual([
      {
        imageUrl: `https://${S3_HOST}/images/ok.png`,
        imageAlt: 'OK',
      },
    ])
  })

  it('drops institutions with null logo URL', async () => {
    prismaMock.institution.findMany.mockResolvedValue([
      makeInstitutionWithLogo({
        id: 1,
        logo: makeImageAsset({ url: null, alt: 'Null URL' }),
      }),
    ] as never)
    const result = await queryInstitutions()
    expect(result).toEqual([])
  })

  it('returns empty array when prisma returns empty', async () => {
    prismaMock.institution.findMany.mockResolvedValue([])
    const result = await queryInstitutions()
    expect(result).toEqual([])
  })
})

describe('queryWebpages', () => {
  it('calls prisma.webpage.findMany with where, include business, publishedDate desc', async () => {
    prismaMock.webpage.findMany.mockResolvedValue([])
    await queryWebpages('blog_post')
    expect(prismaMock.webpage.findMany).toHaveBeenCalledWith({
      where: { type: 'blog_post' },
      include: { business: true },
      orderBy: { publishedDate: 'desc' },
    })
  })

  it('maps webpage rows with business_name from related business', async () => {
    prismaMock.webpage.findMany.mockResolvedValue([
      makeWebpageWithBusiness({
        id: 1,
        title: 'Post',
        author: 'Kim',
        url: 'https://example.com/p/1',
        publishedDate: new Date('2026-06-01T00:00:00Z'),
        business: makeBusiness({ name: 'Hackathon 2026' }),
      }),
    ] as never)
    const result = await queryWebpages('news_article')
    expect(result).toEqual([
      {
        id: 1,
        title: 'Post',
        author: 'Kim',
        url: 'https://example.com/p/1',
        publishedDate: new Date('2026-06-01T00:00:00Z'),
        business_name: 'Hackathon 2026',
      },
    ])
  })

  it('maps business_name to empty string when business is null', async () => {
    prismaMock.webpage.findMany.mockResolvedValue([
      makeWebpageWithBusiness({
        id: 2,
        url: 'https://example.com/p/2',
        business: null,
      }),
    ] as never)
    const result = await queryWebpages('press_release')
    expect(result[0].business_name).toBe('')
  })

  it('filters out webpages with http (non-https) URL', async () => {
    prismaMock.webpage.findMany.mockResolvedValue([
      makeWebpageWithBusiness({
        id: 1,
        url: 'http://example.com/insecure',
      }),
      makeWebpageWithBusiness({
        id: 2,
        url: 'https://example.com/ok',
      }),
    ] as never)
    const result = await queryWebpages('blog_post')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('supports blog_post, news_article, and press_release types', async () => {
    prismaMock.webpage.findMany.mockResolvedValue([])
    await queryWebpages('blog_post')
    await queryWebpages('news_article')
    await queryWebpages('press_release')
    expect(prismaMock.webpage.findMany).toHaveBeenNthCalledWith(1, {
      where: { type: 'blog_post' },
      include: { business: true },
      orderBy: { publishedDate: 'desc' },
    })
    expect(prismaMock.webpage.findMany).toHaveBeenNthCalledWith(2, {
      where: { type: 'news_article' },
      include: { business: true },
      orderBy: { publishedDate: 'desc' },
    })
    expect(prismaMock.webpage.findMany).toHaveBeenNthCalledWith(3, {
      where: { type: 'press_release' },
      include: { business: true },
      orderBy: { publishedDate: 'desc' },
    })
  })
})

describe('queryReports', () => {
  it('calls prisma.report.findMany with where, include file, publishedDate desc', async () => {
    prismaMock.report.findMany.mockResolvedValue([])
    await queryReports('meeting')
    expect(prismaMock.report.findMany).toHaveBeenCalledWith({
      where: { type: 'meeting' },
      include: { file: true },
      orderBy: { publishedDate: 'desc' },
    })
  })

  it('maps reports with file_url from file.url for valid pdf URL', async () => {
    prismaMock.report.findMany.mockResolvedValue([
      makeReportWithFile({
        id: 1,
        title: 'Q1',
        publishedDate: new Date('2026-03-31T00:00:00Z'),
        file: makeFileAsset({
          url: `https://${S3_HOST}/files/q1.pdf`,
        }),
      }),
    ] as never)
    const result = await queryReports('meeting')
    expect(result).toEqual([
      {
        id: 1,
        title: 'Q1',
        publishedDate: new Date('2026-03-31T00:00:00Z'),
        file_url: `https://${S3_HOST}/files/q1.pdf`,
      },
    ])
  })

  it('filters out reports whose file.url is not a safe pdf URL', async () => {
    prismaMock.report.findMany.mockResolvedValue([
      makeReportWithFile({
        id: 1,
        file: makeFileAsset({ url: `http://${S3_HOST}/files/a.pdf` }),
      }),
      makeReportWithFile({
        id: 2,
        file: makeFileAsset({ url: `https://${S3_HOST}/files/b.doc` }),
      }),
      makeReportWithFile({
        id: 3,
        file: makeFileAsset({ url: `https://${S3_HOST}/files/c.pdf` }),
      }),
    ] as never)
    const result = await queryReports('donation')
    expect(result.map((r) => r.id)).toEqual([3])
  })

  it('supports both meeting and donation report types', async () => {
    prismaMock.report.findMany.mockResolvedValue([])
    await queryReports('meeting')
    await queryReports('donation')
    expect(prismaMock.report.findMany).toHaveBeenNthCalledWith(1, {
      where: { type: 'meeting' },
      include: { file: true },
      orderBy: { publishedDate: 'desc' },
    })
    expect(prismaMock.report.findMany).toHaveBeenNthCalledWith(2, {
      where: { type: 'donation' },
      include: { file: true },
      orderBy: { publishedDate: 'desc' },
    })
  })
})

describe('getMarkdownsByType', () => {
  it('passes through findMany with where type and effectiveDate desc', async () => {
    const rows = [makeMarkdown({ type: 'articles' })]
    prismaMock.markdown.findMany.mockResolvedValue(rows)
    const result = await getMarkdownsByType('articles')
    expect(prismaMock.markdown.findMany).toHaveBeenCalledWith({
      where: { type: 'articles' },
      orderBy: { effectiveDate: 'desc' },
    })
    expect(result).toBe(rows)
  })

  it('supports privacy type', async () => {
    prismaMock.markdown.findMany.mockResolvedValue([])
    await getMarkdownsByType('privacy')
    expect(prismaMock.markdown.findMany).toHaveBeenCalledWith({
      where: { type: 'privacy' },
      orderBy: { effectiveDate: 'desc' },
    })
  })

  it('supports terms type', async () => {
    prismaMock.markdown.findMany.mockResolvedValue([])
    await getMarkdownsByType('terms')
    expect(prismaMock.markdown.findMany).toHaveBeenCalledWith({
      where: { type: 'terms' },
      orderBy: { effectiveDate: 'desc' },
    })
  })
})

describe('getLatestMarkdownByType', () => {
  it('passes through findFirst with where type and effectiveDate desc', async () => {
    const row = makeMarkdown({ type: 'privacy' })
    prismaMock.markdown.findFirst.mockResolvedValue(row)
    const result = await getLatestMarkdownByType('privacy')
    expect(prismaMock.markdown.findFirst).toHaveBeenCalledWith({
      where: { type: 'privacy' },
      orderBy: { effectiveDate: 'desc' },
    })
    expect(result).toBe(row)
  })

  it('returns null when no markdown found', async () => {
    prismaMock.markdown.findFirst.mockResolvedValue(null)
    const result = await getLatestMarkdownByType('terms')
    expect(result).toBeNull()
  })
})

describe('queryHistories', () => {
  it('calls prisma.history.findMany with image include and date desc order', async () => {
    prismaMock.history.findMany.mockResolvedValue([])
    await queryHistories()
    expect(prismaMock.history.findMany).toHaveBeenCalledWith({
      include: { image: true },
      orderBy: { date: 'desc' },
    })
  })

  it('maps history with valid image URL', async () => {
    prismaMock.history.findMany.mockResolvedValue([
      makeHistoryWithImage({
        id: 1,
        date: new Date('2026-05-01T00:00:00Z'),
        title: '첫 이사회',
        content: '정관',
        image: makeImageAsset({
          url: `https://${S3_HOST}/images/event.png`,
          alt: 'Event',
        }),
      }),
    ] as never)
    const result = await queryHistories()
    expect(result).toEqual([
      {
        id: 1,
        date: new Date('2026-05-01T00:00:00Z'),
        title: '첫 이사회',
        content: '정관',
        imageUrl: `https://${S3_HOST}/images/event.png`,
        imageAlt: 'Event',
      },
    ])
  })

  it('returns null imageUrl/imageAlt for history without image', async () => {
    prismaMock.history.findMany.mockResolvedValue([
      makeHistoryWithImage({
        id: 2,
        image: null,
      }),
    ] as never)
    const result = await queryHistories()
    expect(result[0].imageUrl).toBeNull()
    expect(result[0].imageAlt).toBeNull()
  })

  it('returns null imageUrl when image has disallowed URL but keeps alt', async () => {
    prismaMock.history.findMany.mockResolvedValue([
      makeHistoryWithImage({
        id: 3,
        image: makeImageAsset({
          url: 'http://not-allowed.example.com/images/x.png',
          alt: 'Alt stays',
        }),
      }),
    ] as never)
    const result = await queryHistories()
    expect(result[0].imageUrl).toBeNull()
    expect(result[0].imageAlt).toBe('Alt stays')
  })

  it('returns null imageUrl when image URL is null', async () => {
    prismaMock.history.findMany.mockResolvedValue([
      makeHistoryWithImage({
        id: 4,
        image: makeImageAsset({ url: null, alt: 'No URL' }),
      }),
    ] as never)
    const result = await queryHistories()
    expect(result[0].imageUrl).toBeNull()
    expect(result[0].imageAlt).toBe('No URL')
  })

  it('returns empty array when no histories', async () => {
    prismaMock.history.findMany.mockResolvedValue([])
    const result = await queryHistories()
    expect(result).toEqual([])
  })
})

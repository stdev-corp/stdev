import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/tests/mocks/prisma'
import {
  makeBusiness,
  makeBusinessPage,
  makeFileAsset,
  makeHistoryWithImage,
  makeImageAsset,
  makeInstitution,
  makeInstitutionWithLogo,
  makeMarkdown,
  makeReportWithFile,
  makeWebpageWithBusiness,
} from '@/tests/utils/fixtures'
import type { Business, ImageAsset } from '@prisma/client'
import type { BusinessRole } from '@/utils/cms-types'
import {
  getEventDetail,
  getEventPage,
  getLatestMarkdownByType,
  getMarkdownsByType,
  getSectionIntro,
  queryEventSitemapPaths,
  queryEventWebpages,
  queryEvents,
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
  it('asks only for institutions shown on home, with logo, in id asc order', async () => {
    prismaMock.institution.findMany.mockResolvedValue([])
    await queryInstitutions()
    expect(prismaMock.institution.findMany).toHaveBeenCalledWith({
      where: { showOnHome: true },
      include: { logo: true },
      orderBy: { id: 'asc' },
    })
  })

  it('drops institutions without a logo (event-only hosts and sponsors)', async () => {
    prismaMock.institution.findMany.mockResolvedValue([
      { ...makeInstitution({ id: 1, logoId: null }), logo: null },
      makeInstitutionWithLogo({
        id: 2,
        logo: makeImageAsset({
          url: `https://${S3_HOST}/images/logo-b.png`,
          alt: 'B',
        }),
      }),
    ] as never)
    expect(await queryInstitutions()).toEqual([
      { imageUrl: `https://${S3_HOST}/images/logo-b.png`, imageAlt: 'B' },
    ])
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

describe('asset URLs with S3_PUBLIC_BASE_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('serves institution logos, history images and report PDFs from the base URL', async () => {
    vi.stubEnv('S3_PUBLIC_BASE_URL', 'http://127.0.0.1:9000/stdev-kr')
    prismaMock.institution.findMany.mockResolvedValue([
      makeInstitutionWithLogo({
        logo: makeImageAsset({ url: `https://${S3_HOST}/images/logo.png` }),
      }),
    ] as never)
    prismaMock.history.findMany.mockResolvedValue([
      makeHistoryWithImage({
        image: makeImageAsset({ url: `https://${S3_HOST}/images/event.png` }),
      }),
    ] as never)
    prismaMock.report.findMany.mockResolvedValue([
      makeReportWithFile({
        file: makeFileAsset({ url: `https://${S3_HOST}/files/report.pdf` }),
      }),
    ] as never)

    expect((await queryInstitutions())[0].imageUrl).toBe(
      'http://127.0.0.1:9000/stdev-kr/images/logo.png',
    )
    expect((await queryHistories())[0].imageUrl).toBe(
      'http://127.0.0.1:9000/stdev-kr/images/event.png',
    )
    expect((await queryReports('meeting'))[0].file_url).toBe(
      'http://127.0.0.1:9000/stdev-kr/files/report.pdf',
    )
  })
})

/* ------------------------------------------------------------------ *
 * 행사
 * ------------------------------------------------------------------ */

function roleLink(
  role: BusinessRole,
  sortOrder: number,
  nameKo: string,
  url: string | null = null,
) {
  return {
    businessId: 1,
    institutionId: sortOrder + 100,
    role,
    sortOrder,
    institution: makeInstitution({ nameKo, url }),
  }
}

function eventRow(
  overrides: Partial<Business> = {},
  institutions: ReturnType<typeof roleLink>[] = [],
  coverImage: ImageAsset | null = null,
) {
  return { ...makeBusiness(overrides), institutions, coverImage }
}

const eventInclude = {
  institutions: {
    include: { institution: true },
    orderBy: [{ role: 'asc' }, { sortOrder: 'asc' }],
  },
}

describe('queryEvents', () => {
  it('asks for the section categories, newest start date first', async () => {
    prismaMock.business.findMany.mockResolvedValue([])
    await queryEvents('hackathon')
    expect(prismaMock.business.findMany).toHaveBeenCalledWith({
      where: { category: { in: ['hackathon', 'ideathon'] } },
      include: eventInclude,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    })

    await queryEvents('conference')
    expect(prismaMock.business.findMany).toHaveBeenLastCalledWith({
      where: { category: { in: ['conference', 'program'] } },
      include: eventInclude,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    })
  })

  it('keeps the DB order and maps each business to an event summary', async () => {
    prismaMock.business.findMany.mockResolvedValue([
      eventRow({
        id: 2,
        name: 'DSF 2026',
        slug: 'dsf26',
        category: 'hackathon',
        startDate: new Date('2026-04-18T00:00:00Z'),
        endDate: new Date('2026-04-19T00:00:00Z'),
        location: 'KAIST',
        summary: '요약',
      }),
      eventRow({
        id: 1,
        name: '아이디어톤 2025',
        slug: 'idea25',
        category: 'ideathon',
        startDate: new Date('2025-08-01T05:00:00Z'),
        endDate: new Date('2025-08-01T10:00:00Z'),
        hasTime: true,
        location: null,
      }),
    ] as never)

    expect(await queryEvents('hackathon')).toEqual([
      {
        id: 2,
        name: 'DSF 2026',
        slug: 'dsf26',
        category: 'hackathon',
        href: '/hackathon/dsf26',
        startDate: new Date('2026-04-18T00:00:00Z'),
        endDate: new Date('2026-04-19T00:00:00Z'),
        hasTime: false,
        location: 'KAIST',
        summary: '요약',
        roles: [],
      },
      {
        id: 1,
        name: '아이디어톤 2025',
        slug: 'idea25',
        category: 'ideathon',
        href: '/hackathon/idea25',
        startDate: new Date('2025-08-01T05:00:00Z'),
        endDate: new Date('2025-08-01T10:00:00Z'),
        hasTime: true,
        location: null,
        summary: null,
        roles: [],
      },
    ])
  })

  it('gives a business without a slug no page link', async () => {
    prismaMock.business.findMany.mockResolvedValue([
      eventRow({ slug: null, category: 'program' }),
    ] as never)
    const [event] = await queryEvents('conference')
    expect(event.slug).toBeNull()
    expect(event.href).toBeNull()
  })

  it('builds conference hrefs for conference and program categories', async () => {
    prismaMock.business.findMany.mockResolvedValue([
      eventRow({ id: 1, slug: 'conf26', category: 'conference' }),
      eventRow({ id: 2, slug: 'camp', category: 'program' }),
    ] as never)
    expect((await queryEvents('conference')).map((e) => e.href)).toEqual([
      '/conference/conf26',
      '/conference/camp',
    ])
  })

  it('groups institutions by role in 주최 → 주관 → 후원 → 협력 order, sorted by sortOrder', async () => {
    prismaMock.business.findMany.mockResolvedValue([
      eventRow({ slug: 'dsf26' }, [
        // DB의 role 정렬(enum 순서)과 화면 순서가 달라도 화면 순서를 따른다.
        roleLink('partner', 0, '협력 기관', 'https://partner.example.com'),
        roleLink('sponsor', 2, '후원 둘'),
        roleLink('sponsor', 1, '후원 하나', 'https://sponsor.example.com'),
        roleLink('host', 0, '주최 기관', 'https://host.example.com'),
      ]),
    ] as never)

    const [event] = await queryEvents('hackathon')
    expect(event.roles).toEqual([
      {
        role: 'host',
        label: '주최',
        organizations: [{ name: '주최 기관', url: 'https://host.example.com' }],
      },
      {
        role: 'sponsor',
        label: '후원',
        organizations: [
          { name: '후원 하나', url: 'https://sponsor.example.com' },
          { name: '후원 둘', url: null },
        ],
      },
      {
        role: 'partner',
        label: '협력',
        organizations: [
          { name: '협력 기관', url: 'https://partner.example.com' },
        ],
      },
    ])
  })

  it('drops institution URLs that are not https', async () => {
    prismaMock.business.findMany.mockResolvedValue([
      eventRow({ slug: 'dsf26' }, [
        roleLink('organizer', 0, 'http 기관', 'http://insecure.example.com'),
        roleLink('organizer', 1, '이상한 기관', 'javascript:alert(1)'),
        roleLink('organizer', 2, '주소 없는 기관', null),
      ]),
    ] as never)
    const [event] = await queryEvents('hackathon')
    expect(event.roles).toEqual([
      {
        role: 'organizer',
        label: '주관',
        organizations: [
          { name: 'http 기관', url: null },
          { name: '이상한 기관', url: null },
          { name: '주소 없는 기관', url: null },
        ],
      },
    ])
  })
})

describe('getSectionIntro', () => {
  it('returns the latest intro markdown content of the section', async () => {
    prismaMock.markdown.findFirst.mockResolvedValue(
      makeMarkdown({ type: 'hackathon', content: '# 해커톤 소개' }),
    )
    expect(await getSectionIntro('hackathon')).toBe('# 해커톤 소개')
    expect(prismaMock.markdown.findFirst).toHaveBeenCalledWith({
      where: { type: 'hackathon' },
      orderBy: { effectiveDate: 'desc' },
    })
  })

  it('reads the conference markdown type for the conference section', async () => {
    prismaMock.markdown.findFirst.mockResolvedValue(null)
    await getSectionIntro('conference')
    expect(prismaMock.markdown.findFirst).toHaveBeenCalledWith({
      where: { type: 'conference' },
      orderBy: { effectiveDate: 'desc' },
    })
  })

  it('returns null when there is no intro', async () => {
    prismaMock.markdown.findFirst.mockResolvedValue(null)
    expect(await getSectionIntro('conference')).toBeNull()
  })
})

describe('getEventDetail', () => {
  const NOTION_ID = '1b83ff07-ff5b-8051-810e-ea2915cdc850'
  const NOTION_HEX = NOTION_ID.replace(/-/g, '')

  it('looks the business up by slug with institutions and cover image', async () => {
    prismaMock.business.findUnique.mockResolvedValue(null)
    await getEventDetail('hackathon', 'dsf26')
    expect(prismaMock.business.findUnique).toHaveBeenCalledWith({
      where: { slug: 'dsf26' },
      include: { ...eventInclude, coverImage: true },
    })
  })

  it('returns the event page with summary, cover image and no ancestors', async () => {
    prismaMock.business.findUnique.mockResolvedValue(
      eventRow(
        {
          id: 7,
          name: 'DSF 2026',
          slug: 'dsf26',
          category: 'hackathon',
          icon: '🚀',
          content: '# 안내\n\n본문',
        },
        [roleLink('host', 0, 'STDev', 'https://stdev.kr')],
        makeImageAsset({ url: `https://${S3_HOST}/images/cover.png` }),
      ) as never,
    )

    const result = await getEventDetail('hackathon', 'dsf26')
    expect(result).toEqual({
      kind: 'found',
      value: {
        event: expect.objectContaining({
          id: 7,
          name: 'DSF 2026',
          slug: 'dsf26',
          href: '/hackathon/dsf26',
          roles: [
            {
              role: 'host',
              label: '주최',
              organizations: [{ name: 'STDev', url: 'https://stdev.kr' }],
            },
          ],
        }),
        title: 'DSF 2026',
        icon: '🚀',
        coverImageUrl: `https://${S3_HOST}/images/cover.png`,
        content: '# 안내\n\n본문',
        pageLinks: {},
        ancestors: [],
      },
    })
    // ::page 지시어가 없으면 링크를 찾으러 DB에 가지 않는다.
    expect(prismaMock.businessPage.findMany).not.toHaveBeenCalled()
    expect(prismaMock.business.findMany).not.toHaveBeenCalled()
  })

  it('drops a cover image that is missing or not an allowed S3 image', async () => {
    prismaMock.business.findUnique.mockResolvedValueOnce(
      eventRow({ slug: 'dsf26' }, [], null) as never,
    )
    prismaMock.business.findUnique.mockResolvedValueOnce(
      eventRow(
        { slug: 'dsf26' },
        [],
        makeImageAsset({ url: 'https://evil.example.com/images/x.png' }),
      ) as never,
    )
    prismaMock.business.findUnique.mockResolvedValueOnce(
      eventRow({ slug: 'dsf26' }, [], makeImageAsset({ url: null })) as never,
    )
    for (let i = 0; i < 3; i += 1) {
      const result = await getEventDetail('hackathon', 'dsf26')
      expect(result.kind === 'found' && result.value.coverImageUrl).toBeNull()
    }
  })

  it('redirects to the other section when the event belongs there', async () => {
    prismaMock.business.findUnique.mockResolvedValue(
      eventRow({ slug: 'conf26', category: 'conference' }) as never,
    )
    expect(await getEventDetail('hackathon', 'conf26')).toEqual({
      kind: 'redirect',
      href: '/conference/conf26',
    })

    prismaMock.business.findUnique.mockResolvedValue(
      eventRow({ slug: 'idea25', category: 'ideathon' }) as never,
    )
    expect(await getEventDetail('conference', 'idea25')).toEqual({
      kind: 'redirect',
      href: '/hackathon/idea25',
    })
  })

  it('is missing when the slug is unknown and is not a Notion page ID', async () => {
    prismaMock.business.findUnique.mockResolvedValue(null)
    expect(await getEventDetail('hackathon', 'nope')).toEqual({
      kind: 'missing',
    })
    // 노션 ID 꼴이 아니면 노션 ID로 다시 찾지 않는다.
    expect(prismaMock.business.findUnique).toHaveBeenCalledTimes(1)
    expect(prismaMock.businessPage.findUnique).not.toHaveBeenCalled()
  })

  it('redirects an old Notion page ID of an event to its new address', async () => {
    prismaMock.business.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        slug: 'skyst23',
        category: 'conference',
      } as never)

    expect(await getEventDetail('hackathon', NOTION_HEX)).toEqual({
      kind: 'redirect',
      href: '/conference/skyst23',
    })
    expect(prismaMock.business.findUnique).toHaveBeenLastCalledWith({
      where: { notionId: NOTION_ID },
      select: { slug: true, category: true },
    })
  })

  it('accepts the dashed, upper-case form of a Notion ID', async () => {
    prismaMock.business.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ slug: 'dsf26', category: 'hackathon' } as never)
    expect(await getEventDetail('hackathon', NOTION_ID.toUpperCase())).toEqual({
      kind: 'redirect',
      href: '/hackathon/dsf26',
    })
    expect(prismaMock.business.findUnique).toHaveBeenLastCalledWith({
      where: { notionId: NOTION_ID },
      select: { slug: true, category: true },
    })
  })

  it('redirects an old Notion page ID of a sub page to the page address', async () => {
    prismaMock.business.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    prismaMock.businessPage.findUnique.mockResolvedValue({
      path: 'notice/team-building',
      business: { slug: 'dsf26', category: 'hackathon' },
    } as never)

    expect(await getEventDetail('hackathon', NOTION_HEX)).toEqual({
      kind: 'redirect',
      href: '/hackathon/dsf26/notice/team-building',
    })
    expect(prismaMock.businessPage.findUnique).toHaveBeenCalledWith({
      where: { notionId: NOTION_ID },
      select: {
        path: true,
        business: { select: { slug: true, category: true } },
      },
    })
  })

  it('falls through to sub pages when the Notion ID matches an event without a slug', async () => {
    prismaMock.business.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ slug: null, category: 'hackathon' } as never)
    prismaMock.businessPage.findUnique.mockResolvedValue(null)
    expect(await getEventDetail('hackathon', NOTION_HEX)).toEqual({
      kind: 'missing',
    })
    expect(prismaMock.businessPage.findUnique).toHaveBeenCalledTimes(1)
  })

  it('is missing when the Notion ID page belongs to an event without a slug', async () => {
    prismaMock.business.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    prismaMock.businessPage.findUnique.mockResolvedValue({
      path: 'faq',
      business: { slug: null, category: 'hackathon' },
    } as never)
    expect(await getEventDetail('hackathon', NOTION_HEX)).toEqual({
      kind: 'missing',
    })
  })

  it('treats a business row without a slug as missing', async () => {
    prismaMock.business.findUnique.mockResolvedValue(
      eventRow({ slug: null }) as never,
    )
    expect(await getEventDetail('hackathon', 'dsf26')).toEqual({
      kind: 'missing',
    })
  })

  describe('::page links in the content', () => {
    it('resolves same-event page refs to sub page addresses and titles', async () => {
      prismaMock.business.findUnique.mockResolvedValue(
        eventRow({
          id: 7,
          slug: 'dsf26',
          category: 'hackathon',
          content: '::page{path="faq"}\n\n::page{path="notice/team"}',
        }) as never,
      )
      prismaMock.businessPage.findMany.mockResolvedValue([
        makeBusinessPage({
          businessId: 7,
          path: 'faq',
          title: 'FAQ',
          icon: '❓',
        }),
        makeBusinessPage({
          businessId: 7,
          path: 'notice/team',
          title: '팀 빌딩',
          icon: null,
        }),
      ] as never)

      const result = await getEventDetail('hackathon', 'dsf26')
      expect(result.kind === 'found' && result.value.pageLinks).toEqual({
        ':faq': { href: '/hackathon/dsf26/faq', title: 'FAQ', icon: '❓' },
        ':notice/team': {
          href: '/hackathon/dsf26/notice/team',
          title: '팀 빌딩',
          icon: null,
        },
      })
      // 다른 행사를 가리키지 않으면 다른 행사를 찾지 않는다.
      expect(prismaMock.business.findMany).not.toHaveBeenCalled()
      expect(prismaMock.businessPage.findMany).toHaveBeenCalledWith({
        where: { businessId: { in: [7] } },
        select: { businessId: true, path: true, title: true, icon: true },
      })
    })

    it('resolves refs to other events and their pages, across sections', async () => {
      prismaMock.business.findUnique.mockResolvedValue(
        eventRow({
          id: 7,
          slug: 'dsf26',
          category: 'hackathon',
          content: [
            '::page{event="skyst23"}',
            '::page{event="skyst23" path="skyst"}',
            '::page{event="dsf25" path="faq"}',
            '::page{event="dsf25"}',
          ].join('\n\n'),
        }) as never,
      )
      prismaMock.business.findMany.mockResolvedValue([
        {
          id: 3,
          slug: 'skyst23',
          category: 'conference',
          name: 'SKYST 2023',
          icon: '🌌',
        },
        {
          id: 5,
          slug: 'dsf25',
          category: 'hackathon',
          name: 'DSF 2025',
          icon: null,
        },
      ] as never)
      prismaMock.businessPage.findMany.mockResolvedValue([
        makeBusinessPage({
          businessId: 3,
          path: 'skyst',
          title: 'SKYST 소개',
          icon: null,
        }),
        makeBusinessPage({
          businessId: 5,
          path: 'faq',
          title: '작년 FAQ',
          icon: '❓',
        }),
        // 같은 path라도 다른 행사의 페이지와 섞지 않는다.
        makeBusinessPage({
          businessId: 7,
          path: 'skyst',
          title: '틀린 페이지',
        }),
      ] as never)

      const result = await getEventDetail('hackathon', 'dsf26')
      expect(result.kind === 'found' && result.value.pageLinks).toEqual({
        'skyst23:': {
          href: '/conference/skyst23',
          title: 'SKYST 2023',
          icon: '🌌',
        },
        'skyst23:skyst': {
          href: '/conference/skyst23/skyst',
          title: 'SKYST 소개',
          icon: null,
        },
        'dsf25:faq': {
          href: '/hackathon/dsf25/faq',
          title: '작년 FAQ',
          icon: '❓',
        },
        'dsf25:': { href: '/hackathon/dsf25', title: 'DSF 2025', icon: null },
      })
      expect(prismaMock.business.findMany).toHaveBeenCalledWith({
        where: { slug: { in: ['skyst23', 'dsf25'] } },
        select: {
          id: true,
          slug: true,
          category: true,
          name: true,
          icon: true,
        },
      })
      expect(prismaMock.businessPage.findMany).toHaveBeenCalledWith({
        where: { businessId: { in: [7, 3, 5] } },
        select: { businessId: true, path: true, title: true, icon: true },
      })
    })

    it('treats event="<current slug>" as the current event and does not look it up again', async () => {
      prismaMock.business.findUnique.mockResolvedValue(
        eventRow({
          id: 7,
          slug: 'dsf26',
          name: 'STDev Science Hackathon 2026',
          icon: '🌸',
          category: 'hackathon',
          content: '::page{event="dsf26" path="faq"}\n\n::page{event="dsf26"}',
        }) as never,
      )
      prismaMock.businessPage.findMany.mockResolvedValue([
        makeBusinessPage({
          businessId: 7,
          path: 'faq',
          title: 'FAQ',
          icon: null,
        }),
      ] as never)

      const result = await getEventDetail('hackathon', 'dsf26')
      const links = result.kind === 'found' ? result.value.pageLinks : {}
      expect(links['dsf26:faq']).toEqual({
        href: '/hackathon/dsf26/faq',
        title: 'FAQ',
        icon: null,
      })
      // 행사 첫 페이지 링크는 그 행사의 실제 이름과 아이콘을 쓴다.
      expect(links['dsf26:']).toEqual({
        href: '/hackathon/dsf26',
        title: 'STDev Science Hackathon 2026',
        icon: '🌸',
      })
      expect(prismaMock.business.findMany).not.toHaveBeenCalled()
    })

    it('leaves out refs whose event or page does not exist', async () => {
      prismaMock.business.findUnique.mockResolvedValue(
        eventRow({
          id: 7,
          slug: 'dsf26',
          content: [
            '::page{path="missing"}',
            '::page{event="ghost"}',
            '::page{event="ghost" path="faq"}',
            '::page{event="noslug"}',
          ].join('\n\n'),
        }) as never,
      )
      prismaMock.business.findMany.mockResolvedValue([
        {
          id: 9,
          slug: null,
          category: 'hackathon',
          name: '슬러그 없음',
          icon: null,
        },
      ] as never)
      prismaMock.businessPage.findMany.mockResolvedValue([])

      const result = await getEventDetail('hackathon', 'dsf26')
      expect(result.kind === 'found' && result.value.pageLinks).toEqual({})
      expect(prismaMock.business.findMany).toHaveBeenCalledWith({
        where: { slug: { in: ['ghost', 'noslug'] } },
        select: {
          id: true,
          slug: true,
          category: true,
          name: true,
          icon: true,
        },
      })
    })
  })
})

describe('getEventPage', () => {
  const business = {
    id: 7,
    slug: 'dsf26',
    name: 'DSF 2026',
    category: 'hackathon',
  }

  it('looks up the event by slug and the page by event id and joined path', async () => {
    prismaMock.business.findUnique.mockResolvedValue(business as never)
    prismaMock.businessPage.findUnique.mockResolvedValue(null)
    await getEventPage('hackathon', 'dsf26', ['notice', 'team'])
    expect(prismaMock.business.findUnique).toHaveBeenCalledWith({
      where: { slug: 'dsf26' },
      select: { id: true, slug: true, name: true, category: true, icon: true },
    })
    expect(prismaMock.businessPage.findUnique).toHaveBeenCalledWith({
      where: { businessId_path: { businessId: 7, path: 'notice/team' } },
      include: { coverImage: true },
    })
  })

  it('returns a top-level page with the event as its only ancestor', async () => {
    prismaMock.business.findUnique.mockResolvedValue(business as never)
    prismaMock.businessPage.findUnique.mockResolvedValue({
      ...makeBusinessPage({
        businessId: 7,
        path: 'faq',
        title: 'FAQ',
        icon: '❓',
        content: '자주 묻는 질문',
      }),
      coverImage: makeImageAsset({ url: `https://${S3_HOST}/images/faq.png` }),
    } as never)

    expect(await getEventPage('hackathon', 'dsf26', ['faq'])).toEqual({
      kind: 'found',
      value: {
        title: 'FAQ',
        icon: '❓',
        coverImageUrl: `https://${S3_HOST}/images/faq.png`,
        content: '자주 묻는 질문',
        pageLinks: {},
        ancestors: [{ label: 'DSF 2026', href: '/hackathon/dsf26' }],
      },
    })
    // 상위 경로가 없으면 상위 페이지를 찾지 않는다.
    expect(prismaMock.businessPage.findMany).not.toHaveBeenCalled()
  })

  it('adds the titles of parent pages to the ancestors of a nested page', async () => {
    prismaMock.business.findUnique.mockResolvedValue({
      ...business,
      category: 'program',
    } as never)
    prismaMock.businessPage.findUnique.mockResolvedValue({
      ...makeBusinessPage({
        businessId: 7,
        path: 'guide/rooms/a',
        title: 'A호실',
      }),
      coverImage: null,
    } as never)
    prismaMock.businessPage.findMany.mockResolvedValue([
      // DB 순서와 관계없이 경로 순서대로 잇는다.
      { path: 'guide/rooms', title: '강의실' },
      { path: 'guide', title: '안내' },
    ] as never)

    const result = await getEventPage('conference', 'dsf26', [
      'guide',
      'rooms',
      'a',
    ])
    expect(prismaMock.businessPage.findMany).toHaveBeenCalledWith({
      where: { businessId: 7, path: { in: ['guide', 'guide/rooms'] } },
      select: { path: true, title: true },
    })
    expect(result).toEqual({
      kind: 'found',
      value: expect.objectContaining({
        title: 'A호실',
        coverImageUrl: null,
        ancestors: [
          { label: 'DSF 2026', href: '/conference/dsf26' },
          { label: '안내', href: '/conference/dsf26/guide' },
          { label: '강의실', href: '/conference/dsf26/guide/rooms' },
        ],
      }),
    })
  })

  it('skips parent paths that have no page of their own', async () => {
    prismaMock.business.findUnique.mockResolvedValue(business as never)
    prismaMock.businessPage.findUnique.mockResolvedValue({
      ...makeBusinessPage({
        businessId: 7,
        path: 'notice/team',
        title: '팀 빌딩',
      }),
      coverImage: null,
    } as never)
    prismaMock.businessPage.findMany.mockResolvedValue([])

    const result = await getEventPage('hackathon', 'dsf26', ['notice', 'team'])
    expect(result.kind === 'found' && result.value.ancestors).toEqual([
      { label: 'DSF 2026', href: '/hackathon/dsf26' },
    ])
  })

  it('resolves ::page links in the page content against the parent event', async () => {
    prismaMock.business.findUnique.mockResolvedValue(business as never)
    prismaMock.businessPage.findUnique.mockResolvedValue({
      ...makeBusinessPage({
        businessId: 7,
        path: 'notice',
        content: '::page{path="notice/team"}\n\n::page{event="dsf25"}',
      }),
      coverImage: null,
    } as never)
    prismaMock.business.findMany.mockResolvedValue([
      {
        id: 5,
        slug: 'dsf25',
        category: 'hackathon',
        name: 'DSF 2025',
        icon: '🏁',
      },
    ] as never)
    prismaMock.businessPage.findMany.mockResolvedValue([
      makeBusinessPage({
        businessId: 7,
        path: 'notice/team',
        title: '팀 빌딩',
        icon: null,
      }),
    ] as never)

    const result = await getEventPage('hackathon', 'dsf26', ['notice'])
    expect(result.kind === 'found' && result.value.pageLinks).toEqual({
      ':notice/team': {
        href: '/hackathon/dsf26/notice/team',
        title: '팀 빌딩',
        icon: null,
      },
      'dsf25:': { href: '/hackathon/dsf25', title: 'DSF 2025', icon: '🏁' },
    })
  })

  it('redirects to the other section, keeping the page path', async () => {
    prismaMock.business.findUnique.mockResolvedValue({
      ...business,
      category: 'conference',
    } as never)
    expect(
      await getEventPage('hackathon', 'dsf26', ['notice', 'team']),
    ).toEqual({ kind: 'redirect', href: '/conference/dsf26/notice/team' })
    expect(prismaMock.businessPage.findUnique).not.toHaveBeenCalled()
  })

  it('is missing when the event is unknown or has no slug', async () => {
    prismaMock.business.findUnique.mockResolvedValueOnce(null)
    expect(await getEventPage('hackathon', 'nope', ['faq'])).toEqual({
      kind: 'missing',
    })
    prismaMock.business.findUnique.mockResolvedValueOnce({
      ...business,
      slug: null,
    } as never)
    expect(await getEventPage('hackathon', 'dsf26', ['faq'])).toEqual({
      kind: 'missing',
    })
    expect(prismaMock.businessPage.findUnique).not.toHaveBeenCalled()
  })

  it('is missing when the page does not exist', async () => {
    prismaMock.business.findUnique.mockResolvedValue(business as never)
    prismaMock.businessPage.findUnique.mockResolvedValue(null)
    expect(await getEventPage('hackathon', 'dsf26', ['nope'])).toEqual({
      kind: 'missing',
    })
  })
})

describe('queryEventWebpages', () => {
  it('asks for webpages of the type linked to an event of the section', async () => {
    prismaMock.webpage.findMany.mockResolvedValue([])
    await queryEventWebpages('news_article', 'hackathon')
    expect(prismaMock.webpage.findMany).toHaveBeenCalledWith({
      where: {
        type: 'news_article',
        business: { category: { in: ['hackathon', 'ideathon'] } },
      },
      include: { business: true },
      orderBy: { publishedDate: 'desc' },
    })

    await queryEventWebpages('blog_post', 'conference')
    expect(prismaMock.webpage.findMany).toHaveBeenLastCalledWith({
      where: {
        type: 'blog_post',
        business: { category: { in: ['conference', 'program'] } },
      },
      include: { business: true },
      orderBy: { publishedDate: 'desc' },
    })
  })

  it('maps rows and drops non-https URLs', async () => {
    prismaMock.webpage.findMany.mockResolvedValue([
      makeWebpageWithBusiness({
        id: 1,
        title: '기사',
        author: '기자',
        url: 'https://news.example.com/1',
        publishedDate: new Date('2026-05-01T00:00:00Z'),
        business: makeBusiness({ name: 'DSF 2026' }),
      }),
      makeWebpageWithBusiness({ id: 2, url: 'http://news.example.com/2' }),
      makeWebpageWithBusiness({
        id: 3,
        url: 'https://news.example.com/3',
        business: null,
      }),
    ] as never)

    expect(await queryEventWebpages('news_article', 'hackathon')).toEqual([
      {
        id: 1,
        title: '기사',
        author: '기자',
        url: 'https://news.example.com/1',
        publishedDate: new Date('2026-05-01T00:00:00Z'),
        business_name: 'DSF 2026',
      },
      expect.objectContaining({ id: 3, business_name: '' }),
    ])
  })
})

describe('queryEventSitemapPaths', () => {
  it('lists every event with a slug and its sub pages', async () => {
    prismaMock.business.findMany.mockResolvedValue([
      {
        slug: 'dsf26',
        category: 'hackathon',
        updatedAt: new Date('2026-04-01T00:00:00Z'),
        pages: [
          { path: 'faq', updatedAt: new Date('2026-04-02T00:00:00Z') },
          { path: 'notice/team', updatedAt: new Date('2026-04-03T00:00:00Z') },
        ],
      },
      {
        slug: 'camp',
        category: 'program',
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        pages: [],
      },
    ] as never)

    expect(await queryEventSitemapPaths()).toEqual([
      {
        path: '/hackathon/dsf26',
        lastModified: new Date('2026-04-01T00:00:00Z'),
      },
      {
        path: '/hackathon/dsf26/faq',
        lastModified: new Date('2026-04-02T00:00:00Z'),
      },
      {
        path: '/hackathon/dsf26/notice/team',
        lastModified: new Date('2026-04-03T00:00:00Z'),
      },
      {
        path: '/conference/camp',
        lastModified: new Date('2025-01-01T00:00:00Z'),
      },
    ])
    expect(prismaMock.business.findMany).toHaveBeenCalledWith({
      where: { slug: { not: null } },
      select: {
        slug: true,
        category: true,
        updatedAt: true,
        pages: { select: { path: true, updatedAt: true } },
      },
    })
  })

  it('returns an empty list when there are no events', async () => {
    prismaMock.business.findMany.mockResolvedValue([])
    expect(await queryEventSitemapPaths()).toEqual([])
  })
})

describe('event cover images with S3_PUBLIC_BASE_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('serves event and page covers from the base URL', async () => {
    vi.stubEnv('S3_PUBLIC_BASE_URL', 'http://127.0.0.1:9000/stdev-kr/')
    prismaMock.business.findUnique.mockResolvedValueOnce(
      eventRow(
        { slug: 'dsf26' },
        [],
        makeImageAsset({ url: `https://${S3_HOST}/images/cover.png` }),
      ) as never,
    )
    const detail = await getEventDetail('hackathon', 'dsf26')
    expect(detail.kind === 'found' && detail.value.coverImageUrl).toBe(
      'http://127.0.0.1:9000/stdev-kr/images/cover.png',
    )

    prismaMock.business.findUnique.mockResolvedValueOnce({
      id: 1,
      slug: 'dsf26',
      name: 'DSF 2026',
      category: 'hackathon',
    } as never)
    prismaMock.businessPage.findUnique.mockResolvedValue({
      ...makeBusinessPage(),
      coverImage: makeImageAsset({ url: `https://${S3_HOST}/images/page.png` }),
    } as never)
    const page = await getEventPage('hackathon', 'dsf26', ['faq'])
    expect(page.kind === 'found' && page.value.coverImageUrl).toBe(
      'http://127.0.0.1:9000/stdev-kr/images/page.png',
    )
  })
})

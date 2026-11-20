import type { ReactElement, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getEventDetailMock,
  getEventPageMock,
  getSectionIntroMock,
  queryEventWebpagesMock,
  queryEventsMock,
  resetCmsMocks,
} from '@/tests/mocks/cms'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import HackathonPage from '@/app/(stdev)/hackathon/page'
import HackathonNewsPage from '@/app/(stdev)/hackathon/news/page'
import HackathonBlogPage from '@/app/(stdev)/hackathon/blog/page'
import HackathonEventPage, {
  generateMetadata as generateHackathonEventMetadata,
} from '@/app/(stdev)/hackathon/[slug]/page'
import HackathonEventSubPage, {
  generateMetadata as generateHackathonEventSubMetadata,
} from '@/app/(stdev)/hackathon/[slug]/[...path]/page'
import ConferencePage from '@/app/(stdev)/conference/page'
import ConferenceNewsPage from '@/app/(stdev)/conference/news/page'
import ConferenceBlogPage from '@/app/(stdev)/conference/blog/page'
import ConferenceEventPage, {
  generateMetadata as generateConferenceEventMetadata,
} from '@/app/(stdev)/conference/[slug]/page'
import ConferenceEventSubPage, {
  generateMetadata as generateConferenceEventSubMetadata,
} from '@/app/(stdev)/conference/[slug]/[...path]/page'
import type {
  BusinessCategory,
  EventDetail,
  EventDocument,
  EventSummary,
  WebpageWithBusiness,
} from '@/utils/cms-types'

// 공용 navigation 목에는 permanentRedirect가 없어, 이 파일에서 next/navigation을
// 직접 목으로 바꾼다. 나머지 내보내기는 원본을 그대로 둔다.
const { notFoundMock, permanentRedirectMock, usePathnameMock } = vi.hoisted(
  () => ({
    notFoundMock: vi.fn(() => {
      const err = new Error('NEXT_NOT_FOUND') as Error & { digest?: string }
      err.digest = 'NEXT_NOT_FOUND'
      throw err
    }),
    permanentRedirectMock: vi.fn((url: string) => {
      const err = new Error(`NEXT_REDIRECT;${url}`) as Error & {
        digest?: string
      }
      err.digest = `NEXT_REDIRECT;replace;${url};308;`
      throw err
    }),
    usePathnameMock: vi.fn(() => '/'),
  }),
)

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  notFound: notFoundMock,
  permanentRedirect: permanentRedirectMock,
  usePathname: usePathnameMock,
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

// MarkdownView는 비동기 서버 컴포넌트라 jsdom에서 그릴 수 없어 내용만 드러낸다.
vi.mock('@/components/markdown/markdown-view', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown-view">{content}</div>
  ),
}))

type AsyncPage = Promise<ReactElement> | ReactElement

/**
 * 페이지는 비동기 뷰(EventSectionView 등)를 요소로 돌려준다. jsdom의 React는
 * 비동기 컴포넌트를 그리지 못하므로 그 뷰를 한 번 더 풀어 준다.
 */
async function resolveView(page: AsyncPage) {
  const element = (await page) as ReactElement<Record<string, unknown>>
  const View = element.type as (
    props: Record<string, unknown>,
  ) => Promise<ReactElement>
  return View(element.props)
}

async function renderPageAt(pathname: string, page: AsyncPage) {
  usePathnameMock.mockReturnValue(pathname)
  return renderWithChakra(await resolveView(page))
}

function breadcrumbItems() {
  const nav = screen.getByRole('navigation', { name: '현재 경로' })
  return within(nav)
    .getAllByRole('listitem')
    .map((item) => ({
      label: item.textContent,
      href: item.querySelector('a')?.getAttribute('href') ?? null,
      current: item.querySelector('[aria-current="page"]') !== null,
    }))
}

function makeEventSummary(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: 1,
    name: 'Dreamers Science Fest 2026',
    slug: 'dsf26',
    category: 'hackathon',
    href: '/hackathon/dsf26',
    startDate: new Date('2026-04-18T00:00:00Z'),
    endDate: new Date('2026-04-19T00:00:00Z'),
    hasTime: false,
    location: 'KAIST 문지캠퍼스',
    summary: null,
    roles: [],
    ...overrides,
  }
}

function makeWebpage(
  overrides: Partial<WebpageWithBusiness> = {},
): WebpageWithBusiness {
  return {
    id: 1,
    title: '해커톤 현장 기사',
    author: '과학신문',
    url: 'https://news.example.com/articles/1',
    publishedDate: new Date('2026-05-01T00:00:00Z'),
    business_name: 'Dreamers Science Fest 2026',
    ...overrides,
  }
}

const sections: {
  section: 'hackathon' | 'conference'
  label: string
  base: string
  otherBase: string
  category: BusinessCategory
  SectionPage: () => AsyncPage
  NewsPage: () => AsyncPage
  BlogPage: () => AsyncPage
  EventPage: typeof HackathonEventPage
  eventMetadata: typeof generateHackathonEventMetadata
  SubPage: typeof HackathonEventSubPage
  subMetadata: typeof generateHackathonEventSubMetadata
}[] = [
  {
    section: 'hackathon',
    label: '해커톤&아이디어톤',
    base: '/hackathon',
    otherBase: '/conference',
    category: 'hackathon',
    SectionPage: HackathonPage,
    NewsPage: HackathonNewsPage,
    BlogPage: HackathonBlogPage,
    EventPage: HackathonEventPage,
    eventMetadata: generateHackathonEventMetadata,
    SubPage: HackathonEventSubPage,
    subMetadata: generateHackathonEventSubMetadata,
  },
  {
    section: 'conference',
    label: '컨퍼런스&프로그램',
    base: '/conference',
    otherBase: '/hackathon',
    category: 'conference',
    SectionPage: ConferencePage,
    NewsPage: ConferenceNewsPage,
    BlogPage: ConferenceBlogPage,
    EventPage: ConferenceEventPage,
    eventMetadata: generateConferenceEventMetadata,
    SubPage: ConferenceEventSubPage,
    subMetadata: generateConferenceEventSubMetadata,
  },
]

describe.each(sections)(
  '$base 구역',
  ({
    section,
    label,
    base,
    otherBase,
    category,
    SectionPage,
    NewsPage,
    BlogPage,
    EventPage,
    eventMetadata,
    SubPage,
    subMetadata,
  }) => {
    beforeEach(() => {
      resetCmsMocks()
      usePathnameMock.mockReturnValue('/')
    })

    describe(`${base} (행사 소개)`, () => {
      it('구역 이름을 유일한 h1으로 두고 소개와 행사 목록 제목을 그린다', async () => {
        getSectionIntroMock.mockResolvedValue('구역 소개 문단입니다.')
        await renderPageAt(base, SectionPage())

        const headings = screen.getAllByRole('heading', { level: 1 })
        expect(headings).toHaveLength(1)
        expect(headings[0]).toHaveTextContent(label)
        expect(screen.getByTestId('markdown-view')).toHaveTextContent(
          '구역 소개 문단입니다.',
        )
        expect(
          screen.getByRole('heading', {
            level: 2,
            name: `STDev가 진행해온 ${label}`,
          }),
        ).toHaveClass('g-tit-line')
        expect(getSectionIntroMock).toHaveBeenCalledWith(section)
        expect(queryEventsMock).toHaveBeenCalledWith(section)
      })

      it('소개가 없으면 소개 블록 없이 빈 목록 안내만 그린다', async () => {
        const { container } = await renderPageAt(base, SectionPage())

        expect(container.querySelectorAll('.g-conts-area')).toHaveLength(1)
        expect(screen.queryByTestId('markdown-view')).toBeNull()
        expect(screen.getByText('등록된 행사가 없습니다.')).toBeInTheDocument()
      })

      it('받은 순서(개최일 내림차순) 그대로 행사를 나열하고 행사 페이지로 연결한다', async () => {
        queryEventsMock.mockResolvedValue([
          makeEventSummary({
            id: 2,
            name: '2026 행사',
            category,
            href: `${base}/event-2026`,
            startDate: new Date('2026-04-18T00:00:00Z'),
            endDate: new Date('2026-04-19T00:00:00Z'),
            summary: '2026 행사 요약',
          }),
          makeEventSummary({
            id: 1,
            name: '2025 행사',
            category,
            slug: null,
            href: null,
            startDate: new Date('2025-08-09T00:00:00Z'),
            endDate: new Date('2025-08-09T00:00:00Z'),
          }),
        ])
        await renderPageAt(base, SectionPage())

        const titles = screen
          .getAllByRole('heading', { level: 3 })
          .map((heading) => heading.textContent)
        expect(titles).toEqual(['2026 행사', '2025 행사'])

        expect(screen.getByRole('link', { name: '2026 행사' })).toHaveAttribute(
          'href',
          `${base}/event-2026`,
        )
        expect(
          screen.getByRole('link', { name: '행사 페이지 보기: 2026 행사' }),
        ).toHaveAttribute('href', `${base}/event-2026`)
        // 슬러그가 없는 행사는 제목만 있고 행사 페이지 링크가 없다.
        expect(screen.queryByRole('link', { name: '2025 행사' })).toBeNull()
        expect(
          screen.queryByRole('link', { name: '행사 페이지 보기: 2025 행사' }),
        ).toBeNull()
        expect(
          screen.getByText('2026년 4월 18일 (토) ~ 4월 19일 (일)'),
        ).toBeInTheDocument()
        expect(screen.getByTestId('markdown-view')).toHaveTextContent(
          '2026 행사 요약',
        )
      })

      it('브레드크럼은 홈 > 구역 > 행사 소개(현재 페이지)다', async () => {
        await renderPageAt(base, SectionPage())

        expect(breadcrumbItems()).toEqual([
          { label: '홈', href: '/', current: false },
          { label, href: null, current: false },
          { label: '행사 소개', href: null, current: true },
        ])
      })
    })

    describe(`${base}/news (뉴스 기사)`, () => {
      it('구역 행사에 연결된 뉴스 기사만 조회해 새 창 링크로 그린다', async () => {
        queryEventWebpagesMock.mockResolvedValue([
          makeWebpage({ id: 1, title: '첫 기사' }),
          makeWebpage({
            id: 2,
            title: '둘째 기사',
            url: 'https://news.example.com/articles/2',
          }),
        ])
        await renderPageAt(`${base}/news`, NewsPage())

        expect(
          screen.getByRole('heading', { level: 1, name: '뉴스 기사' }),
        ).toBeInTheDocument()
        expect(queryEventWebpagesMock).toHaveBeenCalledWith(
          'news_article',
          section,
        )
        const link = screen.getByRole('link', { name: /둘째 기사/ })
        expect(link).toHaveAttribute(
          'href',
          'https://news.example.com/articles/2',
        )
        expect(link).toHaveAttribute('target', '_blank')
        expect(screen.getByRole('link', { name: /첫 기사/ })).toHaveTextContent(
          'Dreamers Science Fest 2026',
        )
      })

      it('기사가 없으면 빈 목록 안내를 그린다', async () => {
        await renderPageAt(`${base}/news`, NewsPage())
        expect(
          screen.getByText('자료가 존재하지 않습니다.'),
        ).toBeInTheDocument()
      })

      it('브레드크럼의 현재 페이지는 뉴스 기사다', async () => {
        await renderPageAt(`${base}/news`, NewsPage())
        expect(breadcrumbItems()).toEqual([
          { label: '홈', href: '/', current: false },
          { label, href: null, current: false },
          { label: '뉴스 기사', href: null, current: true },
        ])
      })
    })

    describe(`${base}/blog (참여후기)`, () => {
      it('구역 행사에 연결된 블로그 후기를 조회해 그린다', async () => {
        queryEventWebpagesMock.mockResolvedValue([
          makeWebpage({
            title: '참가 후기',
            author: '참가자',
            url: 'https://blog.example.com/post',
          }),
        ])
        await renderPageAt(`${base}/blog`, BlogPage())

        expect(
          screen.getByRole('heading', { level: 1, name: '참가자 블로그 후기' }),
        ).toBeInTheDocument()
        expect(queryEventWebpagesMock).toHaveBeenCalledWith(
          'blog_post',
          section,
        )
        expect(screen.getByRole('link', { name: /참가 후기/ })).toHaveAttribute(
          'href',
          'https://blog.example.com/post',
        )
      })

      it('후기가 없으면 빈 목록 안내를 그린다', async () => {
        await renderPageAt(`${base}/blog`, BlogPage())
        expect(
          screen.getByText('자료가 존재하지 않습니다.'),
        ).toBeInTheDocument()
      })

      it('브레드크럼의 현재 페이지는 참여후기다', async () => {
        await renderPageAt(`${base}/blog`, BlogPage())
        expect(breadcrumbItems().at(-1)).toEqual({
          label: '참여후기',
          href: null,
          current: true,
        })
      })
    })

    describe(`${base}/[slug] (행사 페이지)`, () => {
      const detail: EventDetail = {
        title: 'DSF 2026 행사 안내',
        icon: '🚀',
        coverImageUrl: 'https://images.example.com/cover.png',
        content: '# 행사 안내\n\n본문 내용입니다.\n\n::page{path="faq"}',
        pageLinks: {
          ':faq': { href: `${base}/dsf26/faq`, title: 'FAQ', icon: '❓' },
        },
        ancestors: [],
        event: makeEventSummary({
          category,
          href: `${base}/dsf26`,
          roles: [
            {
              role: 'host',
              label: '주최',
              organizations: [
                { name: 'STDev', url: 'https://stdev.kr' },
                { name: '과학재단', url: null },
              ],
            },
          ],
        }),
      }
      const params = () => Promise.resolve({ slug: 'dsf26' })

      it('노션 제목·아이콘·커버와 DB 개요, 노션 본문을 그린다', async () => {
        getEventDetailMock.mockResolvedValue({ kind: 'found', value: detail })
        const { container } = await renderPageAt(
          `${base}/dsf26`,
          EventPage({ params: params() }),
        )

        expect(getEventDetailMock).toHaveBeenCalledWith(section, 'dsf26')
        const headings = screen.getAllByRole('heading', { level: 1 })
        expect(headings).toHaveLength(1)
        expect(headings[0]).toHaveTextContent('DSF 2026 행사 안내')
        expect(headings[0]).toHaveClass('notion-title')
        expect(container.querySelector('.notion-cover img')).toHaveAttribute(
          'src',
          'https://images.example.com/cover.png',
        )
        expect(container.querySelector('.notion-page-icon')).toHaveTextContent(
          '🚀',
        )

        const overview = screen.getByRole('region', { name: '행사 개요' })
        expect(overview).toHaveTextContent(
          '2026년 4월 18일 (토) ~ 4월 19일 (일)',
        )
        expect(overview).toHaveTextContent('KAIST 문지캠퍼스')
        expect(overview).toHaveTextContent('주최STDev, 과학재단')
        expect(
          within(overview).getByRole('link', { name: 'STDev' }),
        ).toHaveAttribute('href', 'https://stdev.kr')

        // 노션 본문의 h1은 페이지 제목 아래 단계인 h2로 내려 그린다.
        expect(
          screen.getByRole('heading', { level: 2, name: '행사 안내' }),
        ).toBeInTheDocument()
        expect(screen.getByText('본문 내용입니다.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute(
          'href',
          `${base}/dsf26/faq`,
        )
      })

      it('브레드크럼은 행사 소개를 링크로 두고 행사 제목을 현재 페이지로 붙인다', async () => {
        getEventDetailMock.mockResolvedValue({ kind: 'found', value: detail })
        await renderPageAt(`${base}/dsf26`, EventPage({ params: params() }))

        expect(breadcrumbItems()).toEqual([
          { label: '홈', href: '/', current: false },
          { label, href: null, current: false },
          { label: '행사 소개', href: base, current: false },
          { label: 'DSF 2026 행사 안내', href: null, current: true },
        ])
      })

      it('다른 구역의 행사면 그 주소로 영구 이동시킨다', async () => {
        getEventDetailMock.mockResolvedValue({
          kind: 'redirect',
          href: `${otherBase}/dsf26`,
        })

        await expect(
          resolveView(EventPage({ params: params() })),
        ).rejects.toMatchObject({
          digest: `NEXT_REDIRECT;replace;${otherBase}/dsf26;308;`,
        })
        expect(permanentRedirectMock).toHaveBeenCalledWith(`${otherBase}/dsf26`)
        expect(notFoundMock).not.toHaveBeenCalled()
      })

      it('없는 행사면 notFound()를 부른다', async () => {
        getEventDetailMock.mockResolvedValue({ kind: 'missing' })

        await expect(
          resolveView(EventPage({ params: params() })),
        ).rejects.toMatchObject({ digest: 'NEXT_NOT_FOUND' })
        expect(notFoundMock).toHaveBeenCalledTimes(1)
        expect(permanentRedirectMock).not.toHaveBeenCalled()
      })

      it('generateMetadata는 행사 제목으로 문서 제목을 만든다', async () => {
        getEventDetailMock.mockResolvedValue({ kind: 'found', value: detail })

        await expect(eventMetadata({ params: params() })).resolves.toEqual({
          title: 'DSF 2026 행사 안내 | STDev Corp.',
        })
        expect(getEventDetailMock).toHaveBeenCalledWith(section, 'dsf26')
      })

      it.each([
        { kind: 'missing' as const },
        { kind: 'redirect' as const, href: `${otherBase}/dsf26` },
      ])(
        'generateMetadata는 행사를 찾지 못하면($kind) 빈 메타데이터를 돌려준다',
        async (lookup) => {
          getEventDetailMock.mockResolvedValue(lookup)

          await expect(eventMetadata({ params: params() })).resolves.toEqual({})
          expect(notFoundMock).not.toHaveBeenCalled()
          expect(permanentRedirectMock).not.toHaveBeenCalled()
        },
      )
    })

    describe(`${base}/[slug]/[...path] (행사 하위 페이지)`, () => {
      const page: EventDocument = {
        title: '팀 빌딩 안내',
        icon: '👥',
        coverImageUrl: null,
        content: '## 팀 구성\n\n세 명이 한 팀입니다.',
        pageLinks: {},
        ancestors: [
          { label: 'DSF 2026 행사 안내', href: `${base}/dsf26` },
          { label: '공지', href: `${base}/dsf26/notice` },
        ],
      }
      const params = () =>
        Promise.resolve({ slug: 'dsf26', path: ['notice', 'team-building'] })

      it('하위 페이지 제목과 노션 본문을 그리고 행사 개요는 그리지 않는다', async () => {
        getEventPageMock.mockResolvedValue({ kind: 'found', value: page })
        const { container } = await renderPageAt(
          `${base}/dsf26/notice/team-building`,
          SubPage({ params: params() }),
        )

        expect(getEventPageMock).toHaveBeenCalledWith(section, 'dsf26', [
          'notice',
          'team-building',
        ])
        const headings = screen.getAllByRole('heading', { level: 1 })
        expect(headings).toHaveLength(1)
        expect(headings[0]).toHaveTextContent('팀 빌딩 안내')
        expect(container.querySelector('.notion-page-icon')).toHaveTextContent(
          '👥',
        )
        // 커버가 없으면 커버 영역도 없다.
        expect(container.querySelector('.notion-cover')).toBeNull()
        expect(
          screen.getByRole('heading', { level: 3, name: '팀 구성' }),
        ).toBeInTheDocument()
        expect(screen.getByText('세 명이 한 팀입니다.')).toBeInTheDocument()
        expect(screen.queryByRole('region', { name: '행사 개요' })).toBeNull()
      })

      it('브레드크럼은 상위 페이지들을 링크로 잇고 하위 페이지 제목을 현재 페이지로 둔다', async () => {
        getEventPageMock.mockResolvedValue({ kind: 'found', value: page })
        await renderPageAt(
          `${base}/dsf26/notice/team-building`,
          SubPage({ params: params() }),
        )

        expect(breadcrumbItems()).toEqual([
          { label: '홈', href: '/', current: false },
          { label, href: null, current: false },
          { label: '행사 소개', href: base, current: false },
          {
            label: 'DSF 2026 행사 안내',
            href: `${base}/dsf26`,
            current: false,
          },
          { label: '공지', href: `${base}/dsf26/notice`, current: false },
          { label: '팀 빌딩 안내', href: null, current: true },
        ])
      })

      it('옛 주소면 새 주소로 영구 이동시킨다', async () => {
        getEventPageMock.mockResolvedValue({
          kind: 'redirect',
          href: `${otherBase}/dsf26/notice/team-building`,
        })

        await expect(
          resolveView(SubPage({ params: params() })),
        ).rejects.toMatchObject({
          digest: `NEXT_REDIRECT;replace;${otherBase}/dsf26/notice/team-building;308;`,
        })
        expect(permanentRedirectMock).toHaveBeenCalledWith(
          `${otherBase}/dsf26/notice/team-building`,
        )
      })

      it('없는 하위 페이지면 notFound()를 부른다', async () => {
        await expect(
          resolveView(SubPage({ params: params() })),
        ).rejects.toMatchObject({ digest: 'NEXT_NOT_FOUND' })
        expect(notFoundMock).toHaveBeenCalledTimes(1)
        expect(permanentRedirectMock).not.toHaveBeenCalled()
      })

      it('generateMetadata는 하위 페이지 제목으로 문서 제목을 만든다', async () => {
        getEventPageMock.mockResolvedValue({ kind: 'found', value: page })

        await expect(subMetadata({ params: params() })).resolves.toEqual({
          title: '팀 빌딩 안내 | STDev Corp.',
        })
        expect(getEventPageMock).toHaveBeenCalledWith(section, 'dsf26', [
          'notice',
          'team-building',
        ])
      })

      it.each([
        { kind: 'missing' as const },
        { kind: 'redirect' as const, href: `${otherBase}/dsf26/faq` },
      ])(
        'generateMetadata는 하위 페이지를 찾지 못하면($kind) 빈 메타데이터를 돌려준다',
        async (lookup) => {
          getEventPageMock.mockResolvedValue(lookup)

          await expect(subMetadata({ params: params() })).resolves.toEqual({})
          expect(notFoundMock).not.toHaveBeenCalled()
          expect(permanentRedirectMock).not.toHaveBeenCalled()
        },
      )
    })
  },
)

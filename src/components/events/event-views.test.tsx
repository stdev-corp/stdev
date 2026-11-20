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
import { render, screen, within } from '@/tests/utils/render'
import {
  EventDetailView,
  EventPageView,
  EventSectionView,
  EventWebpagesView,
  eventDetailMetadata,
  eventPageMetadata,
} from '@/components/events/event-views'
import type {
  EventDetail,
  EventDocument,
  EventSummary,
  WebpageWithBusiness,
} from '@/utils/cms-types'

/*
 * 공용 next/navigation 목(@/tests/mocks/navigation)에는 permanentRedirect가
 * 없어서, 여기서 같은 방식(digest를 가진 오류를 던짐)으로 필요한 것만 만든다.
 */
const navigation = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    const err = new Error('NEXT_NOT_FOUND') as Error & { digest?: string }
    err.digest = 'NEXT_NOT_FOUND'
    throw err
  }),
  permanentRedirect: vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT;${url}`) as Error & {
      digest?: string
    }
    err.digest = `NEXT_REDIRECT;replace;${url};308;`
    throw err
  }),
  usePathname: vi.fn(() => '/'),
}))

vi.mock('next/navigation', () => navigation)

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

// MarkdownView는 async 서버 컴포넌트라 클라이언트 렌더러에서 그릴 수 없다.
vi.mock('@/components/markdown/markdown-view', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown-view">{content}</div>
  ),
}))

const COVER =
  'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/cover.png'

function makeEvent(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: 1,
    name: 'DSF 2026',
    slug: 'dsf26',
    category: 'hackathon',
    href: '/hackathon/dsf26',
    startDate: new Date('2026-04-18T00:00:00Z'),
    endDate: new Date('2026-04-19T00:00:00Z'),
    hasTime: false,
    location: '서울 강남구',
    summary: null,
    roles: [
      {
        role: 'host',
        label: '주최',
        organizations: [{ name: 'STDev', url: null }],
      },
    ],
    ...overrides,
  }
}

function makeDetail(overrides: Partial<EventDetail> = {}): EventDetail {
  return {
    event: makeEvent(),
    title: 'DSF 2026',
    icon: '🚀',
    coverImageUrl: COVER,
    content: '## 참가 안내\n\n::page{path="faq"}',
    pageLinks: {
      ':faq': {
        href: '/hackathon/dsf26/faq',
        title: '자주 묻는 질문',
        icon: '❓',
      },
    },
    ancestors: [],
    ...overrides,
  }
}

function makeDocument(overrides: Partial<EventDocument> = {}): EventDocument {
  return {
    title: '팀 빌딩',
    icon: null,
    coverImageUrl: null,
    content: '팀을 꾸리는 방법\n\n::page{path="faq"}',
    pageLinks: {
      ':faq': {
        href: '/hackathon/dsf26/faq',
        title: '자주 묻는 질문',
        icon: null,
      },
    },
    ancestors: [
      { label: 'DSF 2026', href: '/hackathon/dsf26' },
      { label: '공지', href: '/hackathon/dsf26/notice' },
    ],
    ...overrides,
  }
}

function makeWebpage(
  overrides: Partial<WebpageWithBusiness> = {},
): WebpageWithBusiness {
  return {
    id: 1,
    title: '해커톤 기사',
    author: '과학일보',
    url: 'https://news.example.com/1',
    publishedDate: new Date('2026-04-20T00:00:00Z'),
    business_name: 'DSF 2026',
    ...overrides,
  }
}

async function renderView(view: Promise<ReactElement>, pathname: string) {
  navigation.usePathname.mockReturnValue(pathname)
  return render(await view)
}

/** 브레드크럼 항목을 [글자, 링크 주소, aria-current]로 읽는다. */
function crumbs() {
  const nav = screen.getByRole('navigation', { name: '현재 경로' })
  return Array.from(nav.querySelectorAll('li')).map((item) => {
    const child = item.firstElementChild!
    return [
      child.textContent,
      child.getAttribute('href'),
      child.getAttribute('aria-current'),
    ]
  })
}

describe('event views', () => {
  beforeEach(() => {
    resetCmsMocks()
    navigation.usePathname.mockReturnValue('/')
  })

  describe('EventSectionView', () => {
    it('구역 소개가 있으면 소개 블록과 행사 목록 블록을 차례로 보여 준다', async () => {
      getSectionIntroMock.mockResolvedValue('STDev 해커톤 소개')
      queryEventsMock.mockResolvedValue([
        makeEvent({ id: 2, name: 'DSF 2026' }),
        makeEvent({ id: 1, name: 'DSF 2025', href: '/hackathon/dsf25' }),
      ])

      const { container } = await renderView(
        EventSectionView({ section: 'hackathon' }),
        '/hackathon',
      )

      expect(getSectionIntroMock).toHaveBeenCalledWith('hackathon')
      expect(queryEventsMock).toHaveBeenCalledWith('hackathon')
      expect(
        screen.getByRole('heading', { level: 1, name: '해커톤&아이디어톤' }),
      ).toHaveClass('h-tit')
      expect(crumbs()).toEqual([
        ['홈', '/', null],
        ['해커톤&아이디어톤', null, null],
        ['행사 소개', null, 'page'],
      ])

      const blocks = Array.from(
        container.querySelectorAll<HTMLElement>('.conts-area > .g-conts-area'),
      )
      expect(blocks).toHaveLength(2)
      expect(within(blocks[0]).getByTestId('markdown-view')).toHaveTextContent(
        'STDev 해커톤 소개',
      )
      expect(
        within(blocks[1]).getByRole('heading', {
          level: 2,
          name: 'STDev가 진행해온 해커톤&아이디어톤',
        }),
      ).toHaveClass('g-tit-line')
      expect(
        Array.from(blocks[1].querySelectorAll('.event-item-tit')).map(
          (title) => title.textContent,
        ),
      ).toEqual(['DSF 2026', 'DSF 2025'])
    })

    it('구역 소개가 없으면 행사 목록 블록만 보여 준다', async () => {
      const { container } = await renderView(
        EventSectionView({ section: 'conference' }),
        '/conference',
      )

      expect(getSectionIntroMock).toHaveBeenCalledWith('conference')
      expect(queryEventsMock).toHaveBeenCalledWith('conference')
      expect(
        screen.getByRole('heading', { level: 1, name: '컨퍼런스&프로그램' }),
      ).toBeInTheDocument()
      const blocks = container.querySelectorAll('.conts-area > .g-conts-area')
      expect(blocks).toHaveLength(1)
      expect(screen.queryByTestId('markdown-view')).toBeNull()
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'STDev가 진행해온 컨퍼런스&프로그램',
        }),
      ).toBeInTheDocument()
      expect(screen.getByText('등록된 행사가 없습니다.')).toBeInTheDocument()
    })
  })

  describe('EventWebpagesView', () => {
    it('뉴스 기사 페이지는 구역 행사에 연결된 기사 목록을 보여 준다', async () => {
      queryEventWebpagesMock.mockResolvedValue([
        makeWebpage({ id: 2, title: '두 번째 기사' }),
        makeWebpage({ id: 1, title: '첫 기사' }),
      ])

      await renderView(
        EventWebpagesView({ section: 'hackathon', type: 'news_article' }),
        '/hackathon/news',
      )

      expect(queryEventWebpagesMock).toHaveBeenCalledWith(
        'news_article',
        'hackathon',
      )
      expect(
        screen.getByRole('heading', { level: 1, name: '뉴스 기사' }),
      ).toBeInTheDocument()
      expect(crumbs().at(-1)).toEqual(['뉴스 기사', null, 'page'])
      const links = screen
        .getAllByRole('link')
        .filter((link) => link.closest('.link-list'))
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        'https://news.example.com/1',
        'https://news.example.com/1',
      ])
      expect(links[0]).toHaveTextContent('두 번째 기사')
      expect(links[1]).toHaveTextContent('첫 기사')
    })

    it('참여후기 페이지는 블로그 후기 제목을 쓰고 비어 있으면 안내를 보여 준다', async () => {
      await renderView(
        EventWebpagesView({ section: 'conference', type: 'blog_post' }),
        '/conference/blog',
      )

      expect(queryEventWebpagesMock).toHaveBeenCalledWith(
        'blog_post',
        'conference',
      )
      expect(
        screen.getByRole('heading', { level: 1, name: '참가자 블로그 후기' }),
      ).toBeInTheDocument()
      expect(crumbs()).toEqual([
        ['홈', '/', null],
        ['컨퍼런스&프로그램', null, null],
        ['참여후기', null, 'page'],
      ])
      expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
    })
  })

  describe('EventDetailView', () => {
    it('행사 페이지를 노션 머리, 행사 개요, 노션 본문 순으로 그린다', async () => {
      getEventDetailMock.mockResolvedValue({
        kind: 'found',
        value: makeDetail(),
      })

      const { container } = await renderView(
        EventDetailView({ section: 'hackathon', slug: 'dsf26' }),
        '/hackathon/dsf26',
      )

      expect(getEventDetailMock).toHaveBeenCalledWith('hackathon', 'dsf26')
      // 행사 페이지는 '행사 소개' 아래의 페이지이므로 그 항목이 링크가 된다.
      expect(crumbs()).toEqual([
        ['홈', '/', null],
        ['해커톤&아이디어톤', null, null],
        ['행사 소개', '/hackathon', null],
        ['DSF 2026', null, 'page'],
      ])

      const article = container.querySelector('article.notion-page')!
      const headings = screen.getAllByRole('heading', { level: 1 })
      expect(headings).toHaveLength(1)
      expect(headings[0]).toHaveTextContent('DSF 2026')
      expect(article).toContainElement(headings[0])
      // 커버는 Next 이미지 최적화를 거친다.
      expect(
        article.querySelector('.notion-cover img')?.getAttribute('src'),
      ).toContain(encodeURIComponent(COVER))
      expect(article.querySelector('.notion-page-icon')).toHaveTextContent('🚀')

      const overview = within(article as HTMLElement).getByRole('region', {
        name: '행사 개요',
      })
      expect(overview).toHaveTextContent('2026년 4월 18일 (토) ~ 4월 19일 (일)')
      expect(overview).toHaveTextContent('서울 강남구')
      expect(overview).toHaveTextContent('STDev')

      const content = article.querySelector('.notion-content')!
      // 개요는 DB 필드로 그리므로 노션 본문보다 앞에 온다.
      expect(
        overview.compareDocumentPosition(content) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(
        within(content as HTMLElement).getByRole('heading', {
          level: 3,
          name: '참가 안내',
        }),
      ).toBeInTheDocument()
      expect(
        within(content as HTMLElement).getByRole('link', {
          name: '자주 묻는 질문',
        }),
      ).toHaveAttribute('href', '/hackathon/dsf26/faq')
    })

    it('다른 구역의 행사나 옛 노션 주소면 영구 이동시킨다', async () => {
      getEventDetailMock.mockResolvedValue({
        kind: 'redirect',
        href: '/conference/dsf26',
      })

      await expect(
        EventDetailView({ section: 'hackathon', slug: 'dsf26' }),
      ).rejects.toThrow('NEXT_REDIRECT;/conference/dsf26')
      expect(navigation.permanentRedirect).toHaveBeenCalledWith(
        '/conference/dsf26',
      )
      expect(navigation.notFound).not.toHaveBeenCalled()
    })

    it('없는 행사면 404로 보낸다', async () => {
      await expect(
        EventDetailView({ section: 'hackathon', slug: 'nope' }),
      ).rejects.toThrow('NEXT_NOT_FOUND')
      expect(getEventDetailMock).toHaveBeenCalledWith('hackathon', 'nope')
      expect(navigation.notFound).toHaveBeenCalledTimes(1)
      expect(navigation.permanentRedirect).not.toHaveBeenCalled()
    })
  })

  describe('EventPageView', () => {
    it('하위 페이지를 상위 페이지 브레드크럼과 함께 노션 페이지로 그린다', async () => {
      getEventPageMock.mockResolvedValue({
        kind: 'found',
        value: makeDocument(),
      })

      const { container } = await renderView(
        EventPageView({
          section: 'hackathon',
          slug: 'dsf26',
          path: ['notice', 'team-building'],
        }),
        '/hackathon/dsf26/notice/team-building',
      )

      expect(getEventPageMock).toHaveBeenCalledWith('hackathon', 'dsf26', [
        'notice',
        'team-building',
      ])
      expect(crumbs()).toEqual([
        ['홈', '/', null],
        ['해커톤&아이디어톤', null, null],
        ['행사 소개', '/hackathon', null],
        ['DSF 2026', '/hackathon/dsf26', null],
        ['공지', '/hackathon/dsf26/notice', null],
        ['팀 빌딩', null, 'page'],
      ])

      const article = container.querySelector('article.notion-page')!
      expect(
        screen.getByRole('heading', { level: 1, name: '팀 빌딩' }),
      ).toHaveClass('notion-title')
      // 하위 페이지에는 행사 개요, 커버, 아이콘을 두지 않는다.
      expect(screen.queryByRole('region', { name: '행사 개요' })).toBeNull()
      expect(article.querySelector('.notion-cover')).toBeNull()
      expect(article.querySelector('.notion-page-icon')).toBeNull()
      expect(article.querySelector('.notion-content')).toHaveTextContent(
        '팀을 꾸리는 방법',
      )
      expect(
        screen.getByRole('link', { name: '자주 묻는 질문' }),
      ).toHaveAttribute('href', '/hackathon/dsf26/faq')
    })

    it('커버와 아이콘이 있는 하위 페이지는 머리에 그린다', async () => {
      getEventPageMock.mockResolvedValue({
        kind: 'found',
        value: makeDocument({
          title: 'FAQ',
          icon: '❓',
          coverImageUrl: COVER,
          ancestors: [{ label: 'AI 컨퍼런스', href: '/conference/ai' }],
        }),
      })

      const { container } = await renderView(
        EventPageView({ section: 'conference', slug: 'ai', path: ['faq'] }),
        '/conference/ai/faq',
      )

      expect(getEventPageMock).toHaveBeenCalledWith('conference', 'ai', ['faq'])
      expect(crumbs().slice(2)).toEqual([
        ['행사 소개', '/conference', null],
        ['AI 컨퍼런스', '/conference/ai', null],
        ['FAQ', null, 'page'],
      ])
      expect(
        container.querySelector('.notion-cover img')?.getAttribute('src'),
      ).toContain(encodeURIComponent(COVER))
      expect(container.querySelector('.notion-page-icon')).toHaveTextContent(
        '❓',
      )
    })

    it('다른 구역의 행사면 영구 이동시킨다', async () => {
      getEventPageMock.mockResolvedValue({
        kind: 'redirect',
        href: '/conference/dsf26/faq',
      })

      await expect(
        EventPageView({ section: 'hackathon', slug: 'dsf26', path: ['faq'] }),
      ).rejects.toThrow('NEXT_REDIRECT;/conference/dsf26/faq')
      expect(navigation.permanentRedirect).toHaveBeenCalledWith(
        '/conference/dsf26/faq',
      )
    })

    it('없는 하위 페이지면 404로 보낸다', async () => {
      await expect(
        EventPageView({ section: 'hackathon', slug: 'dsf26', path: ['nope'] }),
      ).rejects.toThrow('NEXT_NOT_FOUND')
      expect(navigation.notFound).toHaveBeenCalledTimes(1)
    })
  })

  describe('metadata', () => {
    it('행사 페이지 제목을 문서 제목으로 쓴다', async () => {
      getEventDetailMock.mockResolvedValue({
        kind: 'found',
        value: makeDetail({ title: 'DSF 2026' }),
      })

      await expect(eventDetailMetadata('hackathon', 'dsf26')).resolves.toEqual({
        title: 'DSF 2026 | STDev Corp.',
      })
      expect(getEventDetailMock).toHaveBeenCalledWith('hackathon', 'dsf26')
    })

    it('없거나 이동할 행사는 기본 메타데이터를 그대로 둔다', async () => {
      await expect(eventDetailMetadata('hackathon', 'nope')).resolves.toEqual(
        {},
      )

      getEventDetailMock.mockResolvedValue({
        kind: 'redirect',
        href: '/conference/dsf26',
      })
      await expect(eventDetailMetadata('hackathon', 'dsf26')).resolves.toEqual(
        {},
      )
      // 메타데이터 단계에서는 이동/404를 일으키지 않는다.
      expect(navigation.permanentRedirect).not.toHaveBeenCalled()
      expect(navigation.notFound).not.toHaveBeenCalled()
    })

    it('하위 페이지 제목을 문서 제목으로 쓴다', async () => {
      getEventPageMock.mockResolvedValue({
        kind: 'found',
        value: makeDocument({ title: '팀 빌딩' }),
      })

      await expect(
        eventPageMetadata('hackathon', 'dsf26', ['notice', 'team-building']),
      ).resolves.toEqual({ title: '팀 빌딩 | STDev Corp.' })
      expect(getEventPageMock).toHaveBeenCalledWith('hackathon', 'dsf26', [
        'notice',
        'team-building',
      ])
    })

    it('없는 하위 페이지는 기본 메타데이터를 그대로 둔다', async () => {
      await expect(
        eventPageMetadata('conference', 'ai', ['nope']),
      ).resolves.toEqual({})
      expect(getEventPageMock).toHaveBeenCalledWith('conference', 'ai', [
        'nope',
      ])
    })
  })
})

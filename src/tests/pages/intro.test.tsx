import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getLatestMarkdownByTypeMock,
  queryHistoriesMock,
  resetCmsMocks,
} from '@/tests/mocks/cms'
import {
  renderAsyncServerComponent,
  renderWithChakra,
  screen,
} from '@/tests/utils/render'
import IntroPage from '@/app/(stdev)/intro/page'
import HistoryPage from '@/app/(stdev)/intro/history/page'
import ArticlesPage from '@/app/(stdev)/intro/articles/page'
import ChartPage from '@/app/(stdev)/intro/chart/page'
import DirectorsPage from '@/app/(stdev)/intro/directors/page'
import DirectorsTable from '@/app/(stdev)/intro/directors/table'
import { makeMarkdown } from '@/tests/utils/fixtures'
import type { HistoryEntry } from '@/utils/cms-types'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fetchPriority: _fp, ...rest } = props as {
      fetchPriority?: string
      [key: string]: unknown
    }
    return <img {...rest} />
  },
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/markdown/markdown-view', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown-view">{content}</div>
  ),
}))

const makeHistoryEntry = (
  overrides: Partial<HistoryEntry> = {},
): HistoryEntry => ({
  id: 1,
  date: new Date('2026-05-01T00:00:00Z'),
  title: '첫 이사회',
  content: '정관 채택',
  imageUrl: null,
  imageAlt: null,
  ...overrides,
})

describe('IntroPage (intro landing)', () => {
  it('renders the 법인소개 page title heading', async () => {
    await renderAsyncServerComponent(() => IntroPage())
    expect(
      screen.getByRole('heading', { name: '법인소개', level: 1 }),
    ).toBeInTheDocument()
  })

  it('renders the main greeting as the page description', async () => {
    await renderAsyncServerComponent(() => IntroPage())
    expect(
      screen.getByText('안녕하세요, 사단법인 STDev입니다!'),
    ).toBeInTheDocument()
  })

  it('renders the title image', async () => {
    await renderAsyncServerComponent(() => IntroPage())
    expect(screen.getByAltText('STDev 소개 이미지')).toBeInTheDocument()
  })

  it('renders the 3w1h image', async () => {
    await renderAsyncServerComponent(() => IntroPage())
    expect(
      screen.getByAltText('STDev의 What, Why, Who, How 소개'),
    ).toBeInTheDocument()
  })

  it('renders introductory paragraph text', async () => {
    const { container } = await renderAsyncServerComponent(() => IntroPage())
    expect(container.textContent).toContain('KAIST 총학생회')
  })

  it('renders paragraph about 과학기술정보통신부 사단법인', async () => {
    const { container } = await renderAsyncServerComponent(() => IntroPage())
    expect(container.textContent).toContain('과학기술정보통신부')
  })
})

describe('HistoryPage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders the 연혁 heading', async () => {
    await renderAsyncServerComponent(() => HistoryPage())
    expect(screen.getByRole('heading', { name: '연혁' })).toBeInTheDocument()
  })

  it('calls queryHistories exactly once', async () => {
    await renderAsyncServerComponent(() => HistoryPage())
    expect(queryHistoriesMock).toHaveBeenCalledOnce()
  })

  it('renders empty timeline gracefully with no histories', async () => {
    queryHistoriesMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => HistoryPage())
    expect(screen.getByRole('heading', { name: '연혁' })).toBeInTheDocument()
    expect(screen.queryByText('첫 이사회')).not.toBeInTheDocument()
  })

  it('renders each history item title', async () => {
    queryHistoriesMock.mockResolvedValue([
      makeHistoryEntry({ id: 1, title: '법인 설립' }),
      makeHistoryEntry({
        id: 2,
        title: '첫 해커톤',
        date: new Date('2026-06-01T00:00:00Z'),
      }),
    ])
    await renderAsyncServerComponent(() => HistoryPage())
    expect(screen.getByText('법인 설립')).toBeInTheDocument()
    expect(screen.getByText('첫 해커톤')).toBeInTheDocument()
  })

  it('renders formatted dates for each history item', async () => {
    queryHistoriesMock.mockResolvedValue([
      makeHistoryEntry({
        date: new Date('2026-05-01T00:00:00Z'),
        title: '이사회 개최',
      }),
    ])
    await renderAsyncServerComponent(() => HistoryPage())
    expect(screen.getByText('2026년 5월 1일')).toBeInTheDocument()
  })

  it('renders content text when provided', async () => {
    queryHistoriesMock.mockResolvedValue([
      makeHistoryEntry({ content: '정관이 최초 채택되었습니다' }),
    ])
    await renderAsyncServerComponent(() => HistoryPage())
    expect(screen.getByText('정관이 최초 채택되었습니다')).toBeInTheDocument()
  })

  it('skips content block when content is null', async () => {
    queryHistoriesMock.mockResolvedValue([
      makeHistoryEntry({ title: '내용없는 항목', content: null }),
    ])
    await renderAsyncServerComponent(() => HistoryPage())
    expect(screen.getByText('내용없는 항목')).toBeInTheDocument()
  })

  it('renders an image when imageUrl is provided', async () => {
    queryHistoriesMock.mockResolvedValue([
      makeHistoryEntry({
        title: '이미지 있음',
        imageUrl: 'https://cdn.example/event.png',
        imageAlt: '행사 사진',
      }),
    ])
    await renderAsyncServerComponent(() => HistoryPage())
    expect(screen.getByAltText('행사 사진')).toBeInTheDocument()
  })

  it('falls back to title as image alt when imageAlt is missing', async () => {
    queryHistoriesMock.mockResolvedValue([
      makeHistoryEntry({
        title: '대체 텍스트',
        imageUrl: 'https://cdn.example/event.png',
        imageAlt: null,
      }),
    ])
    await renderAsyncServerComponent(() => HistoryPage())
    expect(screen.getByAltText('대체 텍스트')).toBeInTheDocument()
  })
})

describe('ArticlesPage', () => {
  beforeEach(() => resetCmsMocks())

  it('calls getLatestMarkdownByType with articles', async () => {
    await renderAsyncServerComponent(() => ArticlesPage())
    expect(getLatestMarkdownByTypeMock).toHaveBeenCalledWith('articles')
  })

  describe('when no markdown is registered', () => {
    it('renders fallback 정관 heading', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(null)
      await renderAsyncServerComponent(() => ArticlesPage())
      expect(screen.getByRole('heading', { name: '정관' })).toBeInTheDocument()
    })

    it('shows 정관이 등록되지 않았습니다. message', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(null)
      await renderAsyncServerComponent(() => ArticlesPage())
      expect(
        screen.getByText('정관이 등록되지 않았습니다.'),
      ).toBeInTheDocument()
    })
  })

  describe('when markdown is present', () => {
    it('renders full heading with association name', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(
        makeMarkdown({ type: 'articles', content: '# 정관\n\n본문 내용' }),
      )
      await renderAsyncServerComponent(() => ArticlesPage())
      expect(
        screen.getByRole('heading', { name: '사단법인 에스티데브 정관' }),
      ).toBeInTheDocument()
    })

    it('renders revision and effective dates in Korean format', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(
        makeMarkdown({
          revisionDate: new Date('2026-01-01T00:00:00Z'),
          effectiveDate: new Date('2026-01-10T00:00:00Z'),
          content: '# 정관',
        }),
      )
      const { container } = await renderAsyncServerComponent(() =>
        ArticlesPage(),
      )
      expect(container.textContent).toContain('2026년 1월 1일')
      expect(container.textContent).toContain('2026년 1월 10일')
    })

    it('renders the markdown content through MarkdownView', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(
        makeMarkdown({ content: '# 정관\n\n**본문** 내용입니다' }),
      )
      await renderAsyncServerComponent(() => ArticlesPage())
      const md = screen.getByTestId('markdown-view')
      expect(md.textContent).toContain('본문')
    })
  })
})

describe('ChartPage', () => {
  it('renders the 조직도 heading', async () => {
    await renderAsyncServerComponent(() => ChartPage())
    expect(screen.getByRole('heading', { name: '조직도' })).toBeInTheDocument()
  })

  it('renders the organization chart image', async () => {
    await renderAsyncServerComponent(() => ChartPage())
    const img = screen.getByAltText('사단법인 에스티데브 조직도')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/intro/chart.png')
  })
})

describe('DirectorsPage', () => {
  it('renders 리더십 heading', async () => {
    await renderAsyncServerComponent(() => DirectorsPage())
    expect(screen.getByRole('heading', { name: '리더십' })).toBeInTheDocument()
  })

  it('renders 이사회 subheading', async () => {
    await renderAsyncServerComponent(() => DirectorsPage())
    expect(screen.getByRole('heading', { name: '이사회' })).toBeInTheDocument()
  })

  it('renders governance description referencing 정관 제9조', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      DirectorsPage(),
    )
    expect(container.textContent).toContain('정관 제9조')
  })

  it('renders DirectorsTable with all five directors', async () => {
    await renderAsyncServerComponent(() => DirectorsPage())
    for (const name of ['한우영', '오승빈', '박지호', '신도윤', '이레']) {
      expect(
        screen.getByText((content) => content.includes(name)),
      ).toBeInTheDocument()
    }
  })
})

describe('DirectorsTable (client component)', () => {
  it('renders the header columns', () => {
    renderWithChakra(<DirectorsTable />)
    expect(screen.getByText('성명 (직위)')).toBeInTheDocument()
    expect(screen.getByText('임기')).toBeInTheDocument()
    expect(screen.getByText('약력')).toBeInTheDocument()
  })

  it('renders 이사장 row', () => {
    renderWithChakra(<DirectorsTable />)
    expect(
      screen.getByText((content) => content.includes('한우영')),
    ).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.includes('(이사장)')),
    ).toBeInTheDocument()
  })

  it('renders 상임이사 row', () => {
    renderWithChakra(<DirectorsTable />)
    expect(
      screen.getByText((content) => content.includes('오승빈')),
    ).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.includes('(상임이사)')),
    ).toBeInTheDocument()
  })

  it('renders three 비상임이사 rows', () => {
    renderWithChakra(<DirectorsTable />)
    const tags = screen.getAllByText((content) =>
      content.includes('(비상임이사)'),
    )
    expect(tags.length).toBeGreaterThanOrEqual(3)
  })
})

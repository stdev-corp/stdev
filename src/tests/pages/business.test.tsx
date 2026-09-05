import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryWebpagesMock, resetCmsMocks } from '@/tests/mocks/cms'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import BusinessPage from '@/app/(stdev)/business/page'
import BlogPage from '@/app/(stdev)/business/blog/page'
import NewsPage from '@/app/(stdev)/business/news/page'
import HackathonPage from '@/app/(stdev)/business/hackathon/page'
import ConferencePage from '@/app/(stdev)/business/conference/page'
import { makeWebpageWithBusiness } from '@/tests/utils/fixtures'
import { BusinessMenu } from '@/utils/menus'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
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

describe('BusinessPage', () => {
  it('renders 행사&프로그램 heading', async () => {
    await renderAsyncServerComponent(() => BusinessPage())
    expect(
      screen.getByRole('heading', { name: '행사&프로그램' }),
    ).toBeInTheDocument()
  })

  it('renders a link for every business sub menu', async () => {
    await renderAsyncServerComponent(() => BusinessPage())
    for (const subMenu of BusinessMenu.subMenus) {
      expect(screen.getByRole('link', { name: subMenu.label })).toHaveAttribute(
        'href',
        subMenu.href,
      )
    }
  })
})

describe('BlogPage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders 참가자 블로그 후기 heading', async () => {
    await renderAsyncServerComponent(() => BlogPage())
    expect(
      screen.getByRole('heading', { name: '참가자 블로그 후기' }),
    ).toBeInTheDocument()
  })

  it('shows empty message when no blog posts', async () => {
    queryWebpagesMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => BlogPage())
    expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
  })

  it('renders blog posts when present', async () => {
    queryWebpagesMock.mockResolvedValue([
      makeWebpageWithBusiness({ title: '블로그 후기 1', type: 'blog_post' }),
    ])
    await renderAsyncServerComponent(() => BlogPage())
    expect(screen.getByText('블로그 후기 1')).toBeInTheDocument()
  })

  it('calls queryWebpages with blog_post', async () => {
    await renderAsyncServerComponent(() => BlogPage())
    expect(queryWebpagesMock).toHaveBeenCalledWith('blog_post')
  })
})

describe('NewsPage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders 뉴스 기사 heading', async () => {
    await renderAsyncServerComponent(() => NewsPage())
    expect(
      screen.getByRole('heading', { name: '뉴스 기사' }),
    ).toBeInTheDocument()
  })

  it('shows empty message when no news', async () => {
    queryWebpagesMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => NewsPage())
    expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
  })

  it('renders news articles when present', async () => {
    queryWebpagesMock.mockResolvedValue([
      makeWebpageWithBusiness({ title: '뉴스 기사 1', type: 'news_article' }),
    ])
    await renderAsyncServerComponent(() => NewsPage())
    expect(screen.getByText('뉴스 기사 1')).toBeInTheDocument()
  })

  it('calls queryWebpages with news_article', async () => {
    await renderAsyncServerComponent(() => NewsPage())
    expect(queryWebpagesMock).toHaveBeenCalledWith('news_article')
  })
})

describe('HackathonPage', () => {
  it('renders 해커톤 heading', async () => {
    await renderAsyncServerComponent(() => HackathonPage())
    expect(screen.getByRole('heading', { name: '해커톤' })).toBeInTheDocument()
  })

  it('renders STDev Hackathon Vision section heading', async () => {
    await renderAsyncServerComponent(() => HackathonPage())
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'STDev Hackathon Vision',
      }),
    ).toHaveClass('g-tit-line')
  })

  it('renders 지속 가능성 subheading', async () => {
    await renderAsyncServerComponent(() => HackathonPage())
    expect(
      screen.getByRole('heading', { name: '지속 가능성' }),
    ).toBeInTheDocument()
  })

  it('renders hackathon image', async () => {
    await renderAsyncServerComponent(() => HackathonPage())
    expect(
      screen.getByAltText('STDev가 진행해온 해커톤 목록'),
    ).toBeInTheDocument()
  })
})

describe('ConferencePage', () => {
  it('renders 컨퍼런스 heading', async () => {
    await renderAsyncServerComponent(() => ConferencePage())
    expect(
      screen.getByRole('heading', { name: '컨퍼런스' }),
    ).toBeInTheDocument()
  })

  it('renders conference section heading', async () => {
    await renderAsyncServerComponent(() => ConferencePage())
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'STDev가 진행해온 컨퍼런스',
      }),
    ).toHaveClass('g-tit-line')
  })

  it('renders conference image', async () => {
    await renderAsyncServerComponent(() => ConferencePage())
    expect(
      screen.getByAltText('STDev가 진행해온 컨퍼런스 목록'),
    ).toBeInTheDocument()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import LeftMenu from '@/components/layout/left-menu'
import { BusinessMenu, IntroMenu, type Menu } from '@/utils/menus'
import { Links } from '@/utils/links'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [k: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('<LeftMenu>', () => {
  it('renders the main menu label linking to menu.href', () => {
    renderWithChakra(<LeftMenu menu={IntroMenu} />)

    const main = screen.getByRole('link', { name: '법인소개' })
    expect(main).toHaveAttribute('href', Links.intro)
  })

  it('renders all 4 sub-menu links with correct hrefs for the Intro menu', () => {
    renderWithChakra(<LeftMenu menu={IntroMenu} />)

    const history = screen.getByRole('link', { name: '연혁' })
    expect(history).toHaveAttribute('href', Links.introHistory)

    const chart = screen.getByRole('link', { name: '조직도' })
    expect(chart).toHaveAttribute('href', Links.introChart)

    const directors = screen.getByRole('link', { name: '리더십' })
    expect(directors).toHaveAttribute('href', Links.introDirectors)

    const articles = screen.getByRole('link', { name: '정관' })
    expect(articles).toHaveAttribute('href', Links.introArticles)
  })

  it('renders 1 main + 4 sub anchors for the Intro menu (5 total)', () => {
    renderWithChakra(<LeftMenu menu={IntroMenu} />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })

  it('renders the Business menu with 4 sub-menus', () => {
    renderWithChakra(<LeftMenu menu={BusinessMenu} />)

    expect(screen.getByRole('link', { name: '행사&프로그램' })).toHaveAttribute(
      'href',
      Links.business,
    )
    expect(screen.getByRole('link', { name: '해커톤' })).toHaveAttribute(
      'href',
      Links.businessHackathon,
    )
    expect(screen.getByRole('link', { name: '컨퍼런스' })).toHaveAttribute(
      'href',
      Links.businessConference,
    )
    expect(screen.getByRole('link', { name: '뉴스 기사' })).toHaveAttribute(
      'href',
      Links.businessNews,
    )
    expect(screen.getByRole('link', { name: '참여후기' })).toHaveAttribute(
      'href',
      Links.businessBlog,
    )
  })

  it('renders no sub-menu links when the menu has no subMenus', () => {
    const emptyMenu: Menu = {
      label: '빈메뉴',
      href: '/empty',
      subMenus: [],
    }
    renderWithChakra(<LeftMenu menu={emptyMenu} />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/empty')
    expect(links[0]).toHaveTextContent('빈메뉴')
  })
})

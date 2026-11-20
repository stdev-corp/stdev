import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/navigation'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import {
  ConferenceMenu,
  HackathonMenu,
  InfoMenu,
  IntroMenu,
  type Menu,
} from '@/utils/menus'
import SideNavigation from './side-navigation'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string }
    children: ReactNode
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

function renderMenu(menu: Menu, pathname: string) {
  usePathnameMock.mockReturnValue(pathname)
  return renderWithChakra(<SideNavigation menu={menu} />)
}

function lnbItems(container: HTMLElement) {
  return Array.from(container.querySelectorAll('ul.lnb-list > li'))
}

describe('<SideNavigation>', () => {
  beforeEach(() => {
    resetNavigationMocks()
  })

  it('renders the KRDS LNB landmark labelled by the menu', () => {
    const { container } = renderMenu(IntroMenu, '/intro/history')

    const nav = screen.getByRole('navigation', { name: '법인소개 메뉴' })
    expect(nav).toHaveClass('krds-side-navigation')
    expect(container.querySelector('ul.lnb-list')).not.toBeNull()
  })

  it('renders the menu label as the LNB title', () => {
    const { container } = renderMenu(IntroMenu, '/intro/history')

    const title = container.querySelector('h2.lnb-tit')
    expect(title).not.toBeNull()
    expect(title!.textContent).toBe('법인소개')
    expect(screen.getByRole('heading', { level: 2 })).toBe(title)
  })

  it('renders one lnb-item per sub menu with its label and href', () => {
    const { container } = renderMenu(IntroMenu, '/intro/history')
    const items = lnbItems(container)

    expect(items).toHaveLength(IntroMenu.subMenus.length)
    items.forEach((item) => expect(item).toHaveClass('lnb-item'))
    expect(items.map((item) => item.textContent)).toEqual([
      '사단법인 에스티데브',
      '연혁',
      '조직도',
      '리더십',
      '정관',
    ])
    IntroMenu.subMenus.forEach((subMenu) => {
      expect(screen.getByRole('link', { name: subMenu.label })).toHaveAttribute(
        'href',
        subMenu.href,
      )
    })
  })

  it('marks the sub menu matching the current pathname as active', () => {
    const { container } = renderMenu(IntroMenu, '/intro/history')
    const [, active] = lnbItems(container)

    expect(active).toHaveClass('lnb-item', 'active')
    const link = screen.getByRole('link', { name: '연혁' })
    expect(link).toHaveClass('lnb-btn', 'lnb-link', 'active')
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('leaves the other sub menus inactive', () => {
    const { container } = renderMenu(IntroMenu, '/intro/history')
    const inactive = lnbItems(container).filter(
      (item) => item.textContent !== '연혁',
    )
    expect(inactive).toHaveLength(IntroMenu.subMenus.length - 1)

    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    inactive.forEach((item) => {
      expect(item).not.toHaveClass('active')
      const link = item.querySelector('a')!
      expect(link).toHaveClass('lnb-btn', 'lnb-link')
      expect(link).not.toHaveClass('active')
      expect(link).not.toHaveAttribute('aria-current')
    })
  })

  it('marks no item when the pathname matches no sub menu', () => {
    const { container } = renderMenu(IntroMenu, '/intro')

    expect(container.querySelector('.lnb-item.active')).toBeNull()
    expect(container.querySelector('[aria-current="page"]')).toBeNull()
  })

  it('works for the 안내 및 공시 section', () => {
    const { container } = renderMenu(InfoMenu, '/info/sitemap')

    expect(container.querySelector('h2.lnb-tit')!.textContent).toBe(
      '안내 및 공시',
    )
    expect(
      screen.getByRole('navigation', { name: '안내 및 공시 메뉴' }),
    ).toBeInTheDocument()
    expect(lnbItems(container).at(-1)).toHaveClass('active')
    expect(screen.getByRole('link', { name: '사이트맵' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  describe('행사 구역', () => {
    /** 강조된 항목의 [라벨, aria-current] */
    function activeItems(container: HTMLElement) {
      return lnbItems(container)
        .filter((item) => item.classList.contains('active'))
        .map((item) => {
          const link = item.querySelector('a')!
          expect(link).toHaveClass('lnb-btn', 'lnb-link', 'active')
          return [link.textContent, link.getAttribute('aria-current')]
        })
    }

    it('renders the 해커톤&아이디어톤 sub menus', () => {
      const { container } = renderMenu(HackathonMenu, '/hackathon')

      expect(
        screen.getByRole('navigation', { name: '해커톤&아이디어톤 메뉴' }),
      ).toBeInTheDocument()
      expect(
        lnbItems(container).map((item) => [
          item.textContent,
          item.querySelector('a')!.getAttribute('href'),
        ]),
      ).toEqual([
        ['행사 소개', '/hackathon'],
        ['뉴스 기사', '/hackathon/news'],
        ['참여후기', '/hackathon/blog'],
      ])
    })

    it('marks 행사 소개 as the current page on the section landing', () => {
      const { container } = renderMenu(HackathonMenu, '/hackathon')

      expect(activeItems(container)).toEqual([['행사 소개', 'page']])
    })

    it('prefers the longest matching sub menu over 행사 소개', () => {
      const { container } = renderMenu(HackathonMenu, '/hackathon/news')

      // /hackathon/news는 /hackathon 접두사로도 맞지만 뉴스 기사 하나만 강조한다.
      expect(activeItems(container)).toEqual([['뉴스 기사', 'page']])
      expect(container.querySelectorAll('.lnb-item.active')).toHaveLength(1)
    })

    it('highlights 행사 소개 as the location on an event page that is not in the menu', () => {
      const { container } = renderMenu(HackathonMenu, '/hackathon/dsf26')

      expect(activeItems(container)).toEqual([['행사 소개', 'location']])
      expect(container.querySelector('[aria-current="page"]')).toBeNull()
    })

    it('keeps 행사 소개 as the location on nested event sub pages', () => {
      const { container } = renderMenu(
        ConferenceMenu,
        '/conference/ai/notice/team-building',
      )

      expect(activeItems(container)).toEqual([['행사 소개', 'location']])
    })

    it('marks a deeper path under 참여후기 as its location', () => {
      const { container } = renderMenu(ConferenceMenu, '/conference/blog/2026')

      expect(activeItems(container)).toEqual([['참여후기', 'location']])
    })

    it('does not treat a lookalike prefix as part of the section', () => {
      const { container } = renderMenu(HackathonMenu, '/hackathons')

      expect(activeItems(container)).toEqual([])
      expect(container.querySelector('[aria-current]')).toBeNull()
    })

    it('marks nothing when the pathname is unavailable', () => {
      const { container } = renderMenu(HackathonMenu, null as unknown as string)

      expect(activeItems(container)).toEqual([])
      expect(container.querySelector('[aria-current]')).toBeNull()
    })
  })
})

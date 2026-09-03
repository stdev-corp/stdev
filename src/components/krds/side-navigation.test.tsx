import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/navigation'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import { InfoMenu, IntroMenu, type Menu } from '@/utils/menus'
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
    const [active] = lnbItems(container)

    expect(active).toHaveClass('lnb-item', 'active')
    const link = screen.getByRole('link', { name: '연혁' })
    expect(link).toHaveClass('lnb-btn', 'lnb-link', 'active')
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('leaves the other sub menus inactive', () => {
    const { container } = renderMenu(IntroMenu, '/intro/history')
    const inactive = lnbItems(container).slice(1)

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

  it('works for a section whose menu has no index page', () => {
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
})

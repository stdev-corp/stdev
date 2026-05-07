import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import LeftMenuLayout from '@/components/layout/left-menu-layout'
import { BusinessMenu, IntroMenu } from '@/utils/menus'
import type { Menu } from '@/utils/menus'

vi.mock('@/components/layout/left-menu', () => ({
  default: ({ menu }: { menu: Menu }) => (
    <div data-testid="left-menu">{menu.label}</div>
  ),
}))

vi.mock('@/components/layout/sub-menu-select', () => ({
  default: ({ menu }: { menu: Menu }) => (
    <div data-testid="sub-menu-select">{menu.label}</div>
  ),
}))

vi.mock('@/components/layout/basic-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="basic-layout">{children}</div>
  ),
}))

describe('<LeftMenuLayout>', () => {
  it('renders both LeftMenu (desktop) and SubMenuSelect (mobile) in the DOM', () => {
    renderWithChakra(
      <LeftMenuLayout menu={IntroMenu}>
        <p>content</p>
      </LeftMenuLayout>,
    )

    expect(screen.getByTestId('left-menu')).toBeInTheDocument()
    expect(screen.getByTestId('sub-menu-select')).toBeInTheDocument()
  })

  it('passes the menu prop to both LeftMenu and SubMenuSelect', () => {
    renderWithChakra(
      <LeftMenuLayout menu={IntroMenu}>
        <p>content</p>
      </LeftMenuLayout>,
    )

    expect(screen.getByTestId('left-menu')).toHaveTextContent('법인소개')
    expect(screen.getByTestId('sub-menu-select')).toHaveTextContent('법인소개')
  })

  it('forwards a different menu prop (Business) to both child components', () => {
    renderWithChakra(
      <LeftMenuLayout menu={BusinessMenu}>
        <p>content</p>
      </LeftMenuLayout>,
    )

    expect(screen.getByTestId('left-menu')).toHaveTextContent('행사&프로그램')
    expect(screen.getByTestId('sub-menu-select')).toHaveTextContent(
      '행사&프로그램',
    )
  })

  it('renders children inside BasicLayout', () => {
    renderWithChakra(
      <LeftMenuLayout menu={IntroMenu}>
        <p data-testid="child">hello child</p>
      </LeftMenuLayout>,
    )

    const basic = screen.getByTestId('basic-layout')
    const child = screen.getByTestId('child')
    expect(basic).toContainElement(child)
    expect(child).toHaveTextContent('hello child')
  })

  it('renders multiple children inside BasicLayout', () => {
    renderWithChakra(
      <LeftMenuLayout menu={IntroMenu}>
        <p data-testid="c1">one</p>
        <p data-testid="c2">two</p>
      </LeftMenuLayout>,
    )

    const basic = screen.getByTestId('basic-layout')
    expect(basic).toContainElement(screen.getByTestId('c1'))
    expect(basic).toContainElement(screen.getByTestId('c2'))
  })
})

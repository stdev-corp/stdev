import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import SiteLayout from '@/components/krds/site-layout'
import { BusinessMenu, IntroMenu, type Menu } from '@/utils/menus'

// 헤더/푸터/브레드크럼/LNB는 각자 테스트가 있으므로 여기서는 골격 조립만 검증한다.
vi.mock('@/components/krds/header', () => ({
  default: () => <header data-testid="krds-header" />,
}))

vi.mock('@/components/krds/footer', () => ({
  default: () => <footer data-testid="krds-footer" />,
}))

vi.mock('@/components/krds/breadcrumb', () => ({
  default: () => <nav data-testid="krds-breadcrumb" />,
}))

vi.mock('@/components/krds/side-navigation', () => ({
  default: ({ menu }: { menu: Menu }) => (
    <nav data-testid="krds-side-navigation" data-menu={menu.label} />
  ),
}))

describe('<SiteLayout>', () => {
  it('renders the KRDS shell: #wrap.g-wrap wrapping skip link, header, #container, footer', () => {
    const { container } = renderWithChakra(
      <SiteLayout>
        <p>본문</p>
      </SiteLayout>,
    )
    const wrap = container.querySelector('#wrap')
    expect(wrap).not.toBeNull()
    expect(wrap).toHaveClass('g-wrap')
    expect(wrap).toContainElement(screen.getByTestId('krds-header'))
    expect(wrap).toContainElement(screen.getByTestId('krds-footer'))
    const containerEl = container.querySelector('#container')
    expect(containerEl).not.toBeNull()
    expect(wrap).toContainElement(containerEl as HTMLElement)
  })

  it('renders the skip link before the header', () => {
    const { container } = renderWithChakra(
      <SiteLayout>
        <p>본문</p>
      </SiteLayout>,
    )
    const skip = container.querySelector('#krds-skip-link')
    expect(skip).not.toBeNull()
    const skipLink = screen.getByRole('link', { name: '본문 바로가기' })
    expect(skip).toContainElement(skipLink)
    expect(skipLink).toHaveAttribute('href', '#krds-content')

    const wrapChildren = Array.from(
      (container.querySelector('#wrap') as HTMLElement).children,
    )
    expect(wrapChildren.map((el) => el.id)).toEqual([
      'krds-skip-link',
      '',
      'container',
      '',
    ])
    expect(wrapChildren[1]).toBe(screen.getByTestId('krds-header'))
    expect(wrapChildren[3]).toBe(screen.getByTestId('krds-footer'))
  })

  it('renders children inside .contents#krds-content', () => {
    const { container } = renderWithChakra(
      <SiteLayout>
        <p data-testid="page-body">페이지 본문</p>
      </SiteLayout>,
    )
    const contents = container.querySelector('#krds-content')
    expect(contents).not.toBeNull()
    expect(contents).toHaveClass('contents')
    expect(contents).toHaveAttribute('tabindex', '-1')
    expect(contents).toContainElement(screen.getByTestId('page-body'))
    expect(screen.getByTestId('page-body')).toHaveTextContent('페이지 본문')
  })

  it('renders the side navigation and a two-column inner when a menu is given', () => {
    const { container } = renderWithChakra(
      <SiteLayout menu={IntroMenu}>
        <p data-testid="page-body">본문</p>
      </SiteLayout>,
    )
    const inner = container.querySelector('#container > div')
    expect(inner).toHaveClass('inner', 'in-between')
    const lnb = screen.getByTestId('krds-side-navigation')
    expect(inner).toContainElement(lnb)
    expect(lnb).toHaveAttribute('data-menu', IntroMenu.label)
  })

  it('passes the given menu through to the side navigation', () => {
    renderWithChakra(
      <SiteLayout menu={BusinessMenu}>
        <p>본문</p>
      </SiteLayout>,
    )
    expect(screen.getByTestId('krds-side-navigation')).toHaveAttribute(
      'data-menu',
      BusinessMenu.label,
    )
  })

  it('renders the side navigation before the contents area', () => {
    const { container } = renderWithChakra(
      <SiteLayout menu={IntroMenu}>
        <p>본문</p>
      </SiteLayout>,
    )
    const innerChildren = Array.from(
      (container.querySelector('#container > div') as HTMLElement).children,
    )
    expect(innerChildren.length).toBe(2)
    expect(innerChildren[0]).toBe(screen.getByTestId('krds-side-navigation'))
    expect(innerChildren[1]).toBe(
      container.querySelector('#krds-content') as HTMLElement,
    )
  })

  it('renders a single-column inner and no side navigation without a menu', () => {
    const { container } = renderWithChakra(
      <SiteLayout>
        <p data-testid="page-body">본문</p>
      </SiteLayout>,
    )
    const inner = container.querySelector('#container > div')
    expect(inner).toHaveClass('inner')
    expect(inner).not.toHaveClass('in-between')
    expect(inner?.className).toBe('inner')
    expect(screen.queryByTestId('krds-side-navigation')).not.toBeInTheDocument()
  })

  it('renders the breadcrumb by default, ahead of the children', () => {
    const { container } = renderWithChakra(
      <SiteLayout>
        <p data-testid="page-body">본문</p>
      </SiteLayout>,
    )
    const contents = container.querySelector('#krds-content') as HTMLElement
    const breadcrumb = screen.getByTestId('krds-breadcrumb')
    expect(within(contents).getByTestId('krds-breadcrumb')).toBe(breadcrumb)
    expect(contents.children[0]).toBe(breadcrumb)
    expect(contents.children[1]).toBe(screen.getByTestId('page-body'))
  })

  it('renders the breadcrumb when breadcrumb is explicitly true', () => {
    renderWithChakra(
      <SiteLayout breadcrumb>
        <p>본문</p>
      </SiteLayout>,
    )
    expect(screen.getByTestId('krds-breadcrumb')).toBeInTheDocument()
  })

  it('omits the breadcrumb when breadcrumb={false}', () => {
    const { container } = renderWithChakra(
      <SiteLayout breadcrumb={false}>
        <p data-testid="page-body">본문</p>
      </SiteLayout>,
    )
    expect(screen.queryByTestId('krds-breadcrumb')).not.toBeInTheDocument()
    const contents = container.querySelector('#krds-content') as HTMLElement
    expect(contents.children.length).toBe(1)
    expect(contents.children[0]).toBe(screen.getByTestId('page-body'))
  })

  it('supports a menu with breadcrumb={false} at the same time', () => {
    const { container } = renderWithChakra(
      <SiteLayout menu={IntroMenu} breadcrumb={false}>
        <p data-testid="page-body">본문</p>
      </SiteLayout>,
    )
    expect(container.querySelector('#container > div')).toHaveClass(
      'inner',
      'in-between',
    )
    expect(screen.getByTestId('krds-side-navigation')).toBeInTheDocument()
    expect(screen.queryByTestId('krds-breadcrumb')).not.toBeInTheDocument()
    expect(screen.getByTestId('page-body')).toBeInTheDocument()
  })

  it('renders multiple children in order', () => {
    const children: ReactNode = (
      <>
        <h2 data-testid="first">제목</h2>
        <p data-testid="second">설명</p>
      </>
    )
    const { container } = renderWithChakra(
      <SiteLayout breadcrumb={false}>{children}</SiteLayout>,
    )
    const contents = container.querySelector('#krds-content') as HTMLElement
    expect(Array.from(contents.children)).toEqual([
      screen.getByTestId('first'),
      screen.getByTestId('second'),
    ])
  })
})

import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import MainLayout from '@/components/krds/main-layout'
import type { Menu } from '@/utils/menus'

// 메인 골격만 검증하기 위해 헤더/푸터는 스텁으로 대체한다.
vi.mock('@/components/krds/header', () => ({
  default: () => <header data-testid="krds-header" />,
}))

vi.mock('@/components/krds/footer', () => ({
  default: () => <footer data-testid="krds-footer" />,
}))

// 메인 화면에는 브레드크럼/LNB가 없어야 하므로, 혹시 렌더되면 잡히도록 스텁을 걸어둔다.
vi.mock('@/components/krds/breadcrumb', () => ({
  default: () => <nav data-testid="krds-breadcrumb" />,
}))

vi.mock('@/components/krds/side-navigation', () => ({
  default: ({ menu }: { menu: Menu }) => (
    <nav data-testid="krds-side-navigation" data-menu={menu.label} />
  ),
}))

describe('<MainLayout>', () => {
  it('renders the KRDS shell: #wrap.g-wrap wrapping skip link, header, #container, footer', () => {
    const { container } = renderWithChakra(
      <MainLayout>
        <section>메인</section>
      </MainLayout>,
    )
    const wrap = container.querySelector('#wrap')
    expect(wrap).not.toBeNull()
    expect(wrap).toHaveClass('g-wrap')
    expect(wrap).toContainElement(screen.getByTestId('krds-header'))
    expect(wrap).toContainElement(screen.getByTestId('krds-footer'))

    const wrapChildren = Array.from((wrap as HTMLElement).children)
    expect(wrapChildren.map((el) => el.id)).toEqual([
      'krds-skip-link',
      '',
      'container',
      '',
    ])
    expect(wrapChildren[1]).toBe(screen.getByTestId('krds-header'))
    expect(wrapChildren[3]).toBe(screen.getByTestId('krds-footer'))
  })

  it('renders a skip link pointing at the content area', () => {
    const { container } = renderWithChakra(
      <MainLayout>
        <section>메인</section>
      </MainLayout>,
    )
    const skipLink = screen.getByRole('link', { name: '본문 바로가기' })
    expect(container.querySelector('#krds-skip-link')).toContainElement(
      skipLink,
    )
    expect(skipLink).toHaveAttribute('href', '#krds-content')
  })

  it('marks the container as .main-container', () => {
    const { container } = renderWithChakra(
      <MainLayout>
        <section>메인</section>
      </MainLayout>,
    )
    const containerEl = container.querySelector('#container')
    expect(containerEl).toHaveClass('main-container')
  })

  it('wraps children in #krds-content inside the container', () => {
    const { container } = renderWithChakra(
      <MainLayout>
        <section data-testid="main-body">메인 본문</section>
      </MainLayout>,
    )
    const content = container.querySelector('#krds-content') as HTMLElement
    expect(content).not.toBeNull()
    expect(content).toHaveAttribute('tabindex', '-1')
    expect(content.className).toBe('')
    expect(container.querySelector('#container')).toContainElement(content)
    expect(content).toContainElement(screen.getByTestId('main-body'))
    expect(screen.getByTestId('main-body')).toHaveTextContent('메인 본문')
  })

  it('renders multiple children in order inside the content area', () => {
    const { container } = renderWithChakra(
      <MainLayout>
        <section data-testid="visual">비주얼</section>
        <section data-testid="intro">소개</section>
      </MainLayout>,
    )
    const content = container.querySelector('#krds-content') as HTMLElement
    expect(Array.from(content.children)).toEqual([
      screen.getByTestId('visual'),
      screen.getByTestId('intro'),
    ])
  })

  it('renders no breadcrumb and no side navigation', () => {
    const { container } = renderWithChakra(
      <MainLayout>
        <section>메인</section>
      </MainLayout>,
    )
    expect(screen.queryByTestId('krds-breadcrumb')).not.toBeInTheDocument()
    expect(screen.queryByTestId('krds-side-navigation')).not.toBeInTheDocument()
    expect(container.querySelector('nav')).toBeNull()
    expect(container.querySelector('.contents')).toBeNull()
    expect(container.querySelector('.inner')).toBeNull()
  })
})

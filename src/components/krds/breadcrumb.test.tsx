import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/navigation'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import Breadcrumb from './breadcrumb'

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

function renderAt(pathname: string | null) {
  usePathnameMock.mockReturnValue(pathname as unknown as string)
  return renderWithChakra(<Breadcrumb />)
}

function crumbItems(container: HTMLElement) {
  return Array.from(container.querySelectorAll('ol.breadcrumb > li'))
}

describe('<Breadcrumb>', () => {
  beforeEach(() => {
    resetNavigationMocks()
  })

  it('renders the KRDS breadcrumb landmark with an ordered list', () => {
    const { container } = renderAt('/intro/history')

    const nav = screen.getByRole('navigation', { name: '현재 경로' })
    expect(nav).toHaveClass('krds-breadcrumb-wrap')
    expect(nav).toHaveAttribute('id', 'breadcrumb')
    expect(container.querySelector('ol.breadcrumb')).not.toBeNull()
  })

  it('renders 홈 > 구역 > 현재 페이지 for a sub page', () => {
    const { container } = renderAt('/intro/history')
    const items = crumbItems(container)

    expect(items.map((item) => item.textContent)).toEqual([
      '홈',
      '법인소개',
      '연혁',
    ])
    expect(items[0]).toHaveClass('home')
    expect(items[1]).not.toHaveClass('home')
    expect(items[2]).not.toHaveClass('home')
  })

  it('links every crumb except the current page', () => {
    renderAt('/intro/history')

    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: '법인소개' })).toHaveAttribute(
      'href',
      '/intro',
    )
    expect(screen.queryByRole('link', { name: '연혁' })).toBeNull()
  })

  it('marks the last crumb as a span with aria-current="page"', () => {
    const { container } = renderAt('/intro/history')
    const last = crumbItems(container).at(-1)!.firstElementChild!

    expect(last.tagName).toBe('SPAN')
    expect(last).toHaveClass('txt')
    expect(last).toHaveAttribute('aria-current', 'page')
    expect(last.textContent).toBe('연혁')
  })

  it('renders only 홈 as the current page on the root path', () => {
    const { container } = renderAt('/')
    const items = crumbItems(container)

    expect(items).toHaveLength(1)
    expect(items[0]).toHaveClass('home')
    expect(items[0].firstElementChild!.tagName).toBe('SPAN')
    expect(items[0].firstElementChild).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('falls back to the root path when usePathname returns null', () => {
    const { container } = renderAt(null)

    expect(crumbItems(container).map((item) => item.textContent)).toEqual([
      '홈',
    ])
  })

  it('renders the section itself as the current page on a section index', () => {
    const { container } = renderAt('/notices')
    const items = crumbItems(container)

    expect(items.map((item) => item.textContent)).toEqual(['홈', '공지사항'])
    expect(items[1].firstElementChild!.tagName).toBe('SPAN')
    expect(items[1].firstElementChild).toHaveAttribute('aria-current', 'page')
  })

  it('does not link a section that has no index page', () => {
    const { container } = renderAt('/info/privacy')
    const items = crumbItems(container)

    expect(items.map((item) => item.textContent)).toEqual([
      '홈',
      '안내 및 공시',
      '개인정보처리방침',
    ])
    expect(items[1].firstElementChild!.tagName).toBe('SPAN')
    expect(items[2].firstElementChild!.tagName).toBe('SPAN')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('stops at the section for an unknown page inside a known section', () => {
    const { container } = renderAt('/business/unknown')
    const items = crumbItems(container)

    expect(items.map((item) => item.textContent)).toEqual([
      '홈',
      '행사&프로그램',
    ])
    expect(screen.getByRole('link', { name: '행사&프로그램' })).toHaveAttribute(
      'href',
      '/business',
    )
    expect(screen.queryByText('홈')).toHaveAttribute('href', '/')
  })

  it('renders only the home crumb for a path outside every section', () => {
    const { container } = renderAt('/unknown')
    const items = crumbItems(container)

    expect(items).toHaveLength(1)
    expect(items[0]).toHaveClass('home')
    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(container.querySelector('[aria-current="page"]')).toBeNull()
  })
})

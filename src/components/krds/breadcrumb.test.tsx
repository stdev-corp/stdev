import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/navigation'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import type { Crumb } from '@/utils/breadcrumb'
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

  it('links only 홈; sections have no page and the last crumb is current', () => {
    const { container } = renderAt('/intro/history')

    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.queryByRole('link', { name: '법인소개' })).toBeNull()
    expect(crumbItems(container)[1].firstElementChild!.tagName).toBe('SPAN')
    expect(crumbItems(container)[1].firstElementChild).not.toHaveAttribute(
      'aria-current',
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

  it('renders the section itself as the current page on a bare section path', () => {
    const { container } = renderAt('/notices')
    const items = crumbItems(container)

    expect(items.map((item) => item.textContent)).toEqual(['홈', '공지사항'])
    expect(items[1].firstElementChild!.tagName).toBe('SPAN')
    expect(items[1].firstElementChild).toHaveAttribute('aria-current', 'page')
  })

  it('marks only the last crumb as the current page even though the section crumb is unlinked', () => {
    const { container } = renderAt('/info/sitemap')
    const items = crumbItems(container)

    expect(items.map((item) => item.textContent)).toEqual([
      '홈',
      '안내 및 공시',
      '사이트맵',
    ])
    // 구역 항목은 링크가 없지만 현재 페이지도 아니다.
    expect(items[1].firstElementChild!.tagName).toBe('SPAN')
    expect(items[1].firstElementChild).not.toHaveAttribute('aria-current')
    expect(items[2].firstElementChild).toHaveAttribute('aria-current', 'page')
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('renders the 안내 및 공시 section crumb unlinked like every other section', () => {
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
    const { container } = renderAt('/notices/unknown')
    const items = crumbItems(container)

    expect(items.map((item) => item.textContent)).toEqual(['홈', '공지사항'])
    expect(screen.queryByRole('link', { name: '공지사항' })).toBeNull()
    expect(screen.queryByText('홈')).toHaveAttribute('href', '/')
  })

  it('treats the removed /business section as outside every section', () => {
    const { container } = renderAt('/business/hackathon')

    expect(crumbItems(container).map((item) => item.textContent)).toEqual([
      '홈',
    ])
    expect(screen.queryByText('행사&프로그램')).toBeNull()
  })

  it('renders the 해커톤&아이디어톤 section landing as its 행사 소개 page', () => {
    const { container } = renderAt('/hackathon')
    const items = crumbItems(container)

    expect(items.map((item) => item.textContent)).toEqual([
      '홈',
      '해커톤&아이디어톤',
      '행사 소개',
    ])
    expect(items[2].firstElementChild!.tagName).toBe('SPAN')
    expect(items[2].firstElementChild).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('picks the longest matching sub menu, so /conference/news is 뉴스 기사', () => {
    const { container } = renderAt('/conference/news')

    expect(crumbItems(container).map((item) => item.textContent)).toEqual([
      '홈',
      '컨퍼런스&프로그램',
      '뉴스 기사',
    ])
    // '행사 소개'(/conference)도 접두사로 맞지만 더 긴 주소가 이긴다.
    expect(screen.queryByText('행사 소개')).toBeNull()
  })
})

describe('<Breadcrumb trail>', () => {
  beforeEach(() => {
    resetNavigationMocks()
  })

  function renderTrail(pathname: string, trail: Crumb[]) {
    usePathnameMock.mockReturnValue(pathname)
    return renderWithChakra(<Breadcrumb trail={trail} />)
  }

  function readCrumbs(container: HTMLElement) {
    return crumbItems(container).map((item) => {
      const child = item.firstElementChild!
      return [
        child.tagName,
        child.textContent,
        child.getAttribute('href'),
        child.getAttribute('aria-current'),
      ]
    })
  }

  it('appends an event page under a linked 행사 소개 crumb', () => {
    const { container } = renderTrail('/hackathon/dsf26', [
      { label: 'DSF 2026' },
    ])

    expect(readCrumbs(container)).toEqual([
      ['A', '홈', '/', null],
      ['SPAN', '해커톤&아이디어톤', null, null],
      ['A', '행사 소개', '/hackathon', null],
      ['SPAN', 'DSF 2026', null, 'page'],
    ])
    expect(screen.getByRole('link', { name: '행사 소개' })).toHaveClass('txt')
  })

  it('links every ancestor of a nested event page and marks only the last crumb current', () => {
    const { container } = renderTrail('/conference/ai/notice/team', [
      { label: 'AI 컨퍼런스', href: '/conference/ai' },
      { label: '공지', href: '/conference/ai/notice' },
      { label: '팀 빌딩' },
    ])

    expect(readCrumbs(container)).toEqual([
      ['A', '홈', '/', null],
      ['SPAN', '컨퍼런스&프로그램', null, null],
      ['A', '행사 소개', '/conference', null],
      ['A', 'AI 컨퍼런스', '/conference/ai', null],
      ['A', '공지', '/conference/ai/notice', null],
      ['SPAN', '팀 빌딩', null, 'page'],
    ])
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('links the sub menu even when the pathname equals it, once a trail follows', () => {
    const { container } = renderTrail('/hackathon', [{ label: '추가 항목' }])

    expect(readCrumbs(container).slice(2)).toEqual([
      ['A', '행사 소개', '/hackathon', null],
      ['SPAN', '추가 항목', null, 'page'],
    ])
  })

  it('appends the trail straight after the section when no sub menu matches', () => {
    const { container } = renderTrail('/notices/unknown', [{ label: '문서' }])

    expect(readCrumbs(container)).toEqual([
      ['A', '홈', '/', null],
      ['SPAN', '공지사항', null, null],
      ['SPAN', '문서', null, 'page'],
    ])
  })

  it('renders crumbs that share a label without dropping either', () => {
    const errors = vi.spyOn(console, 'error')
    const { container } = renderTrail('/hackathon/intro', [
      { label: '행사 소개' },
    ])

    expect(crumbItems(container).map((item) => item.textContent)).toEqual([
      '홈',
      '해커톤&아이디어톤',
      '행사 소개',
      '행사 소개',
    ])
    // 같은 라벨이어도 key가 겹치지 않아야 한다.
    expect(
      errors.mock.calls.some((call) => String(call[0]).includes('same key')),
    ).toBe(false)
  })

  it('ignores the trail on the root path and outside every section', () => {
    const root = renderTrail('/', [{ label: '무시' }])
    expect(readCrumbs(root.container)).toEqual([['SPAN', '홈', null, 'page']])
    root.unmount()

    const outside = renderTrail('/unknown', [{ label: '무시' }])
    expect(readCrumbs(outside.container)).toEqual([['A', '홈', '/', null]])
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

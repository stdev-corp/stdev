import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import GlobalNotFound, { metadata } from '@/app/global-not-found'
import { metadata as siteMetadata } from '@/app/(stdev)/layout'

// 전역 404는 공개 사이트의 루트 레이아웃과 404 화면을 그대로 조립한다.
// 둘의 내용은 각자의 테스트가 보므로 여기서는 조립 순서와 메타데이터만 본다.
vi.mock('@/app/(stdev)/layout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="root-layout">{children}</div>
  ),
  metadata: { title: 'mock title', description: 'mock description' },
}))

vi.mock('@/app/(stdev)/not-found', () => ({
  default: () => <div data-testid="not-found-page">404</div>,
}))

describe('GlobalNotFound (app/global-not-found.tsx)', () => {
  it('renders the public 404 screen inside the public root layout', () => {
    renderWithChakra(<GlobalNotFound />)

    const layout = screen.getByTestId('root-layout')
    expect(layout).toContainElement(screen.getByTestId('not-found-page'))
  })

  it('re-exports the public site metadata', () => {
    expect(metadata).toBe(siteMetadata)
  })
})

import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import CenterScreen from '@/components/center-screen'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: ReactNode
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

describe('<CenterScreen>', () => {
  it('renders the provided title as a heading', () => {
    renderWithChakra(
      <CenterScreen title="접근 제한">
        <p>본문</p>
      </CenterScreen>,
    )
    expect(
      screen.getByRole('heading', { name: '접근 제한' }),
    ).toBeInTheDocument()
  })

  it('renders the provided children', () => {
    renderWithChakra(
      <CenterScreen title="알림">
        <p data-testid="body">내용 입니다</p>
      </CenterScreen>,
    )
    expect(screen.getByTestId('body')).toHaveTextContent('내용 입니다')
  })

  it('renders a home link to Links.root ("/")', () => {
    renderWithChakra(
      <CenterScreen title="에러">
        <span>본문</span>
      </CenterScreen>,
    )
    const home = screen.getByRole('link', { name: '홈페이지로 돌아가기' })
    expect(home).toBeInTheDocument()
    expect(home).toHaveAttribute('href', '/')
  })
})

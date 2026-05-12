import { describe, expect, it } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import WithLine from '@/components/with-line'

describe('<WithLine>', () => {
  it('renders children text inside heading', () => {
    renderWithChakra(<WithLine>소개</WithLine>)
    expect(screen.getByText('소개')).toBeInTheDocument()
  })

  it('renders as an h2 heading', () => {
    renderWithChakra(<WithLine>제목</WithLine>)
    const heading = screen.getByRole('heading', { level: 2, name: '제목' })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H2')
  })

  it('renders a teal vertical line sibling to the heading', () => {
    const { container } = renderWithChakra(<WithLine>본문</WithLine>)
    const heading = screen.getByRole('heading', { level: 2 })
    const stack = heading.parentElement
    expect(stack).not.toBeNull()
    expect(stack?.children.length).toBe(2)
    const line = stack?.children[0] as HTMLElement
    expect(line).toBeTruthy()
    expect(line.tagName).toBe('DIV')
    expect(container.firstChild).toBe(stack)
  })

  it('renders nested ReactNode children', () => {
    renderWithChakra(
      <WithLine>
        <span data-testid="nested">안녕</span>
      </WithLine>,
    )
    expect(screen.getByTestId('nested')).toHaveTextContent('안녕')
  })
})

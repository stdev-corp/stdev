import { describe, expect, it } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { AdminSection } from '@/components/admin/section'

describe('<AdminSection>', () => {
  it('renders the title as an h2 heading', () => {
    renderWithChakra(
      <AdminSection title="공지사항 관리">
        <p>body</p>
      </AdminSection>,
    )
    const heading = screen.getByRole('heading', {
      level: 2,
      name: '공지사항 관리',
    })
    expect(heading.tagName).toBe('H2')
  })

  it('renders children inside the section', () => {
    renderWithChakra(
      <AdminSection title="Section">
        <p data-testid="content">내용</p>
      </AdminSection>,
    )
    expect(screen.getByTestId('content')).toHaveTextContent('내용')
  })

  it('wraps content in a <section> element', () => {
    const { container } = renderWithChakra(
      <AdminSection title="T">
        <span>x</span>
      </AdminSection>,
    )
    const section = container.querySelector('section')
    expect(section).not.toBeNull()
    expect(section?.querySelector('h2')?.textContent).toBe('T')
  })
})

import { describe, expect, it } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import SkipLink from '@/components/krds/skip-link'

describe('<SkipLink>', () => {
  it('renders the KRDS skip-link container', () => {
    const { container } = renderWithChakra(<SkipLink />)
    const wrap = container.querySelector('#krds-skip-link')
    expect(wrap).not.toBeNull()
    expect(container.firstChild).toBe(wrap)
  })

  it('renders a single anchor jumping to the main content anchor', () => {
    const { container } = renderWithChakra(<SkipLink />)
    const link = screen.getByRole('link', { name: '본문 바로가기' })
    expect(link).toHaveAttribute('href', '#krds-content')
    expect(container.querySelectorAll('a').length).toBe(1)
    expect(container.querySelector('#krds-skip-link > a')).toBe(link)
  })
})

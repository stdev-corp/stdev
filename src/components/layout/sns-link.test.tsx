import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import SnsLink, {
  GithubLogo,
  HomepageLogo,
  InstagramLogo,
  LinkedinLogo,
  YoutubeLogo,
} from '@/components/layout/sns-link'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: ReactNode
    target?: string
    rel?: string
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

describe('SNS logo components', () => {
  it('HomepageLogo renders an SVG with default size', () => {
    const { container } = renderWithChakra(<HomepageLogo />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('width')).toBe('20')
    expect(svg?.getAttribute('height')).toBe('20')
  })

  it('HomepageLogo respects the size prop', () => {
    const { container } = renderWithChakra(<HomepageLogo size={32} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('32')
    expect(svg?.getAttribute('height')).toBe('32')
  })

  it('InstagramLogo renders an SVG', () => {
    const { container } = renderWithChakra(<InstagramLogo />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('InstagramLogo respects size prop', () => {
    const { container } = renderWithChakra(<InstagramLogo size={40} />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('40')
  })

  it('LinkedinLogo renders an SVG', () => {
    const { container } = renderWithChakra(<LinkedinLogo />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('LinkedinLogo respects size prop', () => {
    const { container } = renderWithChakra(<LinkedinLogo size={12} />)
    expect(container.querySelector('svg')?.getAttribute('height')).toBe('12')
  })

  it('GithubLogo renders an SVG', () => {
    const { container } = renderWithChakra(<GithubLogo />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('GithubLogo respects size prop', () => {
    const { container } = renderWithChakra(<GithubLogo size={48} />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('48')
  })

  it('YoutubeLogo renders an SVG with white fill', () => {
    const { container } = renderWithChakra(<YoutubeLogo />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('fill')).toBe('white')
  })

  it('YoutubeLogo respects size prop', () => {
    const { container } = renderWithChakra(<YoutubeLogo size={24} />)
    expect(container.querySelector('svg')?.getAttribute('height')).toBe('24')
  })
})

describe('<SnsLink>', () => {
  it('renders the provided handle text', () => {
    renderWithChakra(
      <SnsLink
        logo={<GithubLogo />}
        handle="@stdev-kr"
        url="https://github.com/stdev-kr"
      />,
    )
    expect(screen.getByText('@stdev-kr')).toBeInTheDocument()
  })

  it('renders the provided logo', () => {
    const { container } = renderWithChakra(
      <SnsLink
        logo={<HomepageLogo />}
        handle="홈페이지"
        url="https://stdev.kr"
      />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('uses the url prop as the link href', () => {
    renderWithChakra(
      <SnsLink
        logo={<InstagramLogo />}
        handle="@stdev"
        url="https://instagram.com/stdev"
      />,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://instagram.com/stdev')
  })

  it('opens the link in a new tab with noopener noreferrer', () => {
    renderWithChakra(
      <SnsLink
        logo={<LinkedinLogo />}
        handle="linkedin"
        url="https://linkedin.com/company/stdev"
      />,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

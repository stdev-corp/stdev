import { describe, expect, it } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import SnsLink, {
  GithubLogo,
  HomepageLogo,
  InstagramLogo,
  LinkedinLogo,
  YoutubeLogo,
} from '@/components/layout/sns-link'

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

  it('YoutubeLogo renders an SVG filled with currentColor', () => {
    const { container } = renderWithChakra(<YoutubeLogo />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('fill')).toBe('currentColor')
  })

  it('YoutubeLogo respects size prop', () => {
    const { container } = renderWithChakra(<YoutubeLogo size={24} />)
    expect(container.querySelector('svg')?.getAttribute('height')).toBe('24')
  })

  it('every logo inherits its colour from the surrounding text', () => {
    for (const Logo of [
      HomepageLogo,
      InstagramLogo,
      LinkedinLogo,
      GithubLogo,
      YoutubeLogo,
    ]) {
      const { container, unmount } = renderWithChakra(<Logo />)
      expect(container.querySelector('svg')?.getAttribute('fill')).toBe(
        'currentColor',
      )
      unmount()
    }
  })
})

describe('<SnsLink>', () => {
  it('renders the provided handle text for screen readers', () => {
    const { container } = renderWithChakra(
      <SnsLink
        logo={<GithubLogo />}
        handle="@stdev-kr"
        url="https://github.com/stdev-kr"
      />,
    )
    expect(screen.getByText('@stdev-kr')).toBeInTheDocument()
    expect(container.querySelector('span.sr-only')?.textContent).toBe(
      '@stdev-kr',
    )
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
    expect(link).toHaveAttribute('title', '새 창 열림')
  })

  it('renders the link as a KRDS icon button', () => {
    renderWithChakra(
      <SnsLink
        logo={<YoutubeLogo />}
        handle="youtube"
        url="https://youtube.com/@stdev"
      />,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveClass('krds-btn', 'xlarge', 'icon', 'border')
    expect(link.querySelector('span.sr-only')).not.toBeNull()
    expect(link.querySelector('svg')).not.toBeNull()
  })
})

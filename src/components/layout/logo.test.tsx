import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import Logo from '@/components/layout/logo'

vi.mock('next/image', () => ({
  default: (props: {
    src: string
    alt: string
    fill?: boolean
    sizes?: string
    style?: React.CSSProperties
  }) => {
    const { fill: _fill, ...rest } = props
    void _fill
    return <img {...rest} />
  },
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: ReactNode
    passHref?: boolean
    target?: string
    rel?: string
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

describe('<Logo>', () => {
  it('renders an image with the provided src', () => {
    renderWithChakra(<Logo src="/logo.png" url="https://example.com" />)
    const img = screen.getByAltText('logo') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('/logo.png')
  })

  it('renders an accessible alt text on the image', () => {
    renderWithChakra(<Logo src="/a.svg" url="/" />)
    expect(screen.getByAltText('logo')).toBeInTheDocument()
  })

  it('wraps the image in a link pointing to the url prop', () => {
    renderWithChakra(<Logo src="/a.svg" url="https://stdev.kr" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://stdev.kr')
  })

  it('passes sizes attribute to the rendered image', () => {
    renderWithChakra(<Logo src="/a.svg" url="/" />)
    const img = screen.getByAltText('logo')
    expect(img).toHaveAttribute('sizes', '224px')
  })

  it('opens the link in a new tab with safe rel attributes', () => {
    renderWithChakra(<Logo src="/a.svg" url="https://stdev.kr" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('updates when url and src props change', () => {
    const { rerender } = renderWithChakra(
      <Logo src="/a.png" url="https://a.example.com" />,
    )
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://a.example.com',
    )
    rerender(<Logo src="/b.png" url="https://b.example.com" />)
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://b.example.com',
    )
    expect(screen.getByAltText('logo')).toHaveAttribute('src', '/b.png')
  })
})

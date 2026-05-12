import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import ScrollingLogos from '@/components/scrolling-logos'
import type { InstitutionLogo } from '@/utils/cms-types'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      fill: _fill,
      sizes: _sizes,
      priority: _priority,
      loader: _loader,
      blurDataURL: _blurDataURL,
      placeholder: _placeholder,
      quality: _quality,
      loading: _loading,
      unoptimized: _unoptimized,
      ...imgProps
    } = props
    return <img {...imgProps} />
  },
}))

describe('<ScrollingLogos>', () => {
  it('returns null when institutions is empty', () => {
    const { container } = renderWithChakra(<ScrollingLogos institutions={[]} />)
    expect(container.firstChild).toBeNull()
    expect(container.querySelectorAll('img').length).toBe(0)
  })

  it('renders a single institution duplicated twice for seamless scroll', () => {
    const institutions: InstitutionLogo[] = [
      { imageUrl: 'https://cdn.example/one.png', imageAlt: 'Institution One' },
    ]
    renderWithChakra(<ScrollingLogos institutions={institutions} />)
    const images = screen.getAllByAltText('Institution One')
    expect(images.length).toBe(2)
    images.forEach((img) => {
      expect(img).toHaveAttribute('src', 'https://cdn.example/one.png')
    })
  })

  it('renders multiple institutions doubled', () => {
    const institutions: InstitutionLogo[] = [
      { imageUrl: 'https://cdn.example/a.png', imageAlt: 'Alpha' },
      { imageUrl: 'https://cdn.example/b.png', imageAlt: 'Bravo' },
      { imageUrl: 'https://cdn.example/c.png', imageAlt: 'Charlie' },
    ]
    const { container } = renderWithChakra(
      <ScrollingLogos institutions={institutions} />,
    )
    const images = container.querySelectorAll('img')
    expect(images.length).toBe(6)
  })

  it('uses imageAlt for alt text and imageUrl for src', () => {
    const institutions: InstitutionLogo[] = [
      { imageUrl: 'https://cdn.example/z.png', imageAlt: 'Zed Logo' },
    ]
    renderWithChakra(<ScrollingLogos institutions={institutions} />)
    const images = screen.getAllByAltText('Zed Logo')
    expect(images.length).toBe(2)
    images.forEach((img) => {
      expect(img).toHaveAttribute('src', 'https://cdn.example/z.png')
    })
  })

  it('renders duplicated images in correct order (A,B,A,B)', () => {
    const institutions: InstitutionLogo[] = [
      { imageUrl: 'url-a', imageAlt: 'First' },
      { imageUrl: 'url-b', imageAlt: 'Second' },
    ]
    const { container } = renderWithChakra(
      <ScrollingLogos institutions={institutions} />,
    )
    const images = Array.from(container.querySelectorAll('img'))
    expect(images.length).toBe(4)
    expect(images[0]).toHaveAttribute('alt', 'First')
    expect(images[0]).toHaveAttribute('src', 'url-a')
    expect(images[1]).toHaveAttribute('alt', 'Second')
    expect(images[1]).toHaveAttribute('src', 'url-b')
    expect(images[2]).toHaveAttribute('alt', 'First')
    expect(images[2]).toHaveAttribute('src', 'url-a')
    expect(images[3]).toHaveAttribute('alt', 'Second')
    expect(images[3]).toHaveAttribute('src', 'url-b')
  })

  it('falls back to default image when imageUrl is null', () => {
    const institutions: InstitutionLogo[] = [
      { imageUrl: null, imageAlt: 'No URL Provided' },
    ]
    const { container } = renderWithChakra(
      <ScrollingLogos institutions={institutions} />,
    )
    const images = container.querySelectorAll('img')
    expect(images.length).toBe(2)
    images.forEach((img) => {
      expect(img).toHaveAttribute('src', '/images/intro/title.png')
      expect(img).toHaveAttribute('alt', 'No URL Provided')
    })
  })

  it('falls back to generic Logo N alt when imageAlt is null, using modulo index', () => {
    const institutions: InstitutionLogo[] = [
      { imageUrl: 'url1', imageAlt: null },
      { imageUrl: 'url2', imageAlt: null },
    ]
    const { container } = renderWithChakra(
      <ScrollingLogos institutions={institutions} />,
    )
    const images = Array.from(container.querySelectorAll('img'))
    expect(images.length).toBe(4)
    expect(images[0]).toHaveAttribute('alt', 'Logo 1')
    expect(images[1]).toHaveAttribute('alt', 'Logo 2')
    expect(images[2]).toHaveAttribute('alt', 'Logo 1')
    expect(images[3]).toHaveAttribute('alt', 'Logo 2')
  })
})

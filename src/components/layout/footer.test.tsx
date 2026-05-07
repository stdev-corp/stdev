import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import Footer from '@/components/layout/footer'
import { Links } from '@/utils/links'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [k: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string
    alt: string
    [k: string]: unknown
  }) => <img src={src} alt={alt} {...rest} />,
}))

describe('<Footer>', () => {
  it('renders all 5 SNS links with expected URLs and target=_blank', () => {
    renderWithChakra(<Footer />)

    const expectedUrls = [
      'https://stdev.kr',
      'https://instagram.com/stdev.corp',
      'https://www.linkedin.com/company/stdev-corp',
      'https://github.com/stdev-corp',
      'https://www.youtube.com/@stdev-corp',
    ]

    expectedUrls.forEach((url) => {
      const anchor = document.querySelector(`a[href="${url}"]`)
      expect(anchor).not.toBeNull()
      expect(anchor).toHaveAttribute('target', '_blank')
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders SNS handles', () => {
    renderWithChakra(<Footer />)
    expect(screen.getByText('stdev.kr')).toBeInTheDocument()
    expect(screen.getByText('@stdev.corp')).toBeInTheDocument()
    expect(screen.getAllByText('@stdev-corp').length).toBeGreaterThanOrEqual(3)
  })

  it('renders 3 government logos with target=_blank', () => {
    renderWithChakra(<Footer />)

    const govUrls = [Links.msit, Links.nts, Links.acrc]
    govUrls.forEach((url) => {
      const anchor = document.querySelector(`a[href="${url}"]`)
      expect(anchor).not.toBeNull()
      expect(anchor).toHaveAttribute('target', '_blank')
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')
    })

    const images = screen.getAllByAltText('logo')
    expect(images).toHaveLength(3)
    expect(images[0]).toHaveAttribute('src', '/images/gov/msit-logo.png')
    expect(images[1]).toHaveAttribute('src', '/images/gov/nts-logo.png')
    expect(images[2]).toHaveAttribute('src', '/images/gov/acrc-logo.png')
  })

  it('renders STDev company info block', () => {
    renderWithChakra(<Footer />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'STDev' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/상호명: 사단법인 에스티데브/)).toBeInTheDocument()
    expect(screen.getByText(/사업자등록번호: 169-82-00606/)).toBeInTheDocument()
    expect(
      screen.getByText(/통신판매업신고번호: 2025-대전서구-0117/),
    ).toBeInTheDocument()
    expect(screen.getByText(/대표자: 한우영/)).toBeInTheDocument()
    expect(
      screen.getByText(/대전광역시 서구 월평로 65, 802호/),
    ).toBeInTheDocument()
    expect(screen.getByText(/전화: 0507-1441-9392/)).toBeInTheDocument()
  })

  it('renders the 안내 및 공시 links block', () => {
    renderWithChakra(<Footer />)

    const heading = screen.getByRole('heading', {
      level: 2,
      name: '안내 및 공시',
    })
    expect(heading).toBeInTheDocument()

    const privacyLink = screen.getByRole('link', { name: '개인정보처리방침' })
    expect(privacyLink).toHaveAttribute('href', Links.infoPrivacy)

    const termsLink = screen.getByRole('link', { name: '이용약관' })
    expect(termsLink).toHaveAttribute('href', Links.infoTerms)

    const donationLink = screen.getByRole('link', {
      name: '연간 기부금 모금액 및 활용실적',
    })
    expect(donationLink).toHaveAttribute('href', Links.noticesDonation)

    const sitemapLink = screen.getByRole('link', { name: '사이트맵' })
    expect(sitemapLink).toHaveAttribute('href', Links.infoSitemap)
  })

  it('renders copyright notice with the current year', () => {
    renderWithChakra(<Footer />)
    const currentYear = new Date().getFullYear()
    expect(
      screen.getByText(
        new RegExp(
          `©\\s*${currentYear}\\s*STDev Nonprofit Corporation\\.\\s*All rights reserved\\.`,
        ),
      ),
    ).toBeInTheDocument()
  })

  it('renders inside a <footer> landmark', () => {
    const { container } = renderWithChakra(<Footer />)
    const footer = container.querySelector('footer')
    expect(footer).not.toBeNull()
    if (footer) {
      const scoped = within(footer as HTMLElement)
      expect(
        scoped.getByRole('heading', { level: 2, name: 'STDev' }),
      ).toBeInTheDocument()
    }
  })
})

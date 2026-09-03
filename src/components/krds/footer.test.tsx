import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import Footer from '@/components/krds/footer'
import { Links } from '@/utils/links'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      fill: _fill,
      priority: _priority,
      loader: _loader,
      quality: _quality,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      unoptimized: _unoptimized,
      ...imgProps
    } = props
    return <img {...imgProps} />
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
    [key: string]: unknown
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

describe('<Footer>', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the KRDS footer landmark', () => {
    const { container } = renderWithChakra(<Footer />)
    const footer = container.querySelector('footer#krds-footer')
    expect(footer).not.toBeNull()
    expect(footer?.querySelector(':scope > .inner')).not.toBeNull()
  })

  it('renders the 사단법인 STDev wordmark', () => {
    const { container } = renderWithChakra(<Footer />)
    const logo = container.querySelector('.f-logo')
    expect(logo).not.toBeNull()
    expect(logo).toHaveTextContent('사단법인 STDev')
  })

  it('renders the corporate address, registration details and phone number', () => {
    const { container } = renderWithChakra(<Footer />)
    const addresses = container.querySelectorAll('.f-info .info-addr')
    expect(addresses.length).toBe(2)
    expect(addresses[0]).toHaveTextContent(
      '대전광역시 서구 월평로 65, 802호 (월평동, 용원빌딩)',
    )
    expect(addresses[1]).toHaveTextContent(
      '상호명: 사단법인 에스티데브 (STDev Nonprofit Corporation)',
    )
    expect(addresses[1]).toHaveTextContent('대표자: 한우영')
    expect(addresses[1]).toHaveTextContent('사업자등록번호: 169-82-00606')
    expect(addresses[1]).toHaveTextContent(
      '통신판매업신고번호: 2025-대전서구-0117',
    )
    expect(
      container.querySelector('.f-info .info-cs .strong'),
    ).toHaveTextContent('대표전화 0507-1441-9392')
  })

  it('renders the policy shortcut links with their internal hrefs', () => {
    const { container } = renderWithChakra(<Footer />)
    const linkGo = container.querySelector('.f-link .link-go')
    expect(linkGo).not.toBeNull()
    const shortcuts = within(linkGo as HTMLElement)

    const expected: [string, string][] = [
      ['개인정보처리방침', Links.infoPrivacy],
      ['이용약관', Links.infoTerms],
      ['연간 기부금 모금액 및 활용실적', Links.noticesDonation],
      ['사이트맵', Links.infoSitemap],
    ]
    expect(linkGo?.querySelectorAll('a').length).toBe(expected.length)
    expected.forEach(([name, href]) => {
      const link = shortcuts.getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveClass('krds-btn', 'medium', 'text')
      expect(link.querySelector('i.svg-icon.ico-angle.right')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
    })
  })

  it('renders the five SNS links opening in a new tab', () => {
    const { container } = renderWithChakra(<Footer />)
    const linkSns = container.querySelector('.f-link .link-sns')
    expect(linkSns).not.toBeNull()
    const sns = within(linkSns as HTMLElement)

    const expected: [string, string][] = [
      ['stdev.kr 홈페이지', 'https://stdev.kr'],
      ['인스타그램 @stdev.corp', 'https://instagram.com/stdev.corp'],
      ['링크드인 @stdev-corp', 'https://www.linkedin.com/company/stdev-corp'],
      ['깃허브 @stdev-corp', 'https://github.com/stdev-corp'],
      ['유튜브 @stdev-corp', 'https://www.youtube.com/@stdev-corp'],
    ]
    expect(linkSns?.querySelectorAll('a').length).toBe(expected.length)
    expected.forEach(([handle, url]) => {
      const link = sns.getByText(handle).closest('a')
      expect(link).not.toBeNull()
      expect(link).toHaveAttribute('href', url)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link?.querySelector('svg')).not.toBeNull()
    })
  })

  it('renders the three government logos linking out in a new tab', () => {
    const { container } = renderWithChakra(<Footer />)
    const govLogos = container.querySelector('.f-btm .f-gov-logos')
    expect(govLogos).not.toBeNull()

    const expected: [string, string, string][] = [
      ['과학기술정보통신부', Links.msit, '/images/gov/msit-logo.png'],
      ['국세청', Links.nts, '/images/gov/nts-logo.png'],
      ['국민권익위원회', Links.acrc, '/images/gov/acrc-logo.png'],
    ]
    const links = Array.from(govLogos?.querySelectorAll('a') ?? [])
    expect(links.length).toBe(expected.length)
    links.forEach((link, index) => {
      const [alt, url, src] = expected[index]
      expect(link).toHaveAttribute('href', url)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveAttribute('title', '새 창 열림')
      const image = link.querySelector('img')
      expect(image).toHaveAttribute('alt', alt)
      expect(image).toHaveAttribute('src', src)
      expect(image).toHaveAttribute('width', '224')
      expect(image).toHaveAttribute('height', '48')
    })
  })

  it('renders the bottom menu including the 관리자 link', () => {
    const { container } = renderWithChakra(<Footer />)
    const menu = container.querySelector('.f-btm-text .f-menu')
    expect(menu).not.toBeNull()
    const bottom = within(menu as HTMLElement)

    const privacy = bottom.getByRole('link', { name: '개인정보처리방침' })
    expect(privacy).toHaveAttribute('href', Links.infoPrivacy)
    expect(privacy).toHaveClass('point')
    expect(bottom.getByRole('link', { name: '이용약관' })).toHaveAttribute(
      'href',
      Links.infoTerms,
    )
    expect(bottom.getByRole('link', { name: '관리자' })).toHaveAttribute(
      'href',
      Links.admin,
    )
    expect(menu?.querySelectorAll('a').length).toBe(3)
  })

  it('links to 개인정보처리방침 and 이용약관 from both the shortcuts and the bottom menu', () => {
    renderWithChakra(<Footer />)
    expect(
      screen.getAllByRole('link', { name: '개인정보처리방침' }),
    ).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: '이용약관' })).toHaveLength(2)
  })

  it('renders the copyright for the current year', () => {
    const { container } = renderWithChakra(<Footer />)
    const copy = container.querySelector('.f-copy')
    expect(copy).toHaveTextContent(
      `© ${new Date().getFullYear()} STDev Nonprofit Corporation. All rights reserved.`,
    )
  })

  it('takes the copyright year from the system clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2031-06-15T12:00:00Z'))
    const { container } = renderWithChakra(<Footer />)
    expect(container.querySelector('.f-copy')).toHaveTextContent(
      '© 2031 STDev Nonprofit Corporation. All rights reserved.',
    )
  })

  it('renders the 공공누리 제1유형 KRDS attribution with a link to krds.go.kr', () => {
    const { container } = renderWithChakra(<Footer />)
    const attribution = container.querySelector('.f-attribution')
    expect(attribution).not.toBeNull()
    expect(attribution).toHaveTextContent(
      '본 누리집은 행정안전부에서 공공누리 제1유형으로 개방한 『범정부 UI/UX 디자인시스템(KRDS)』을 이용하였으며, 해당 저작물은 KRDS 누리집에서 무료로 내려받을 수 있습니다.',
    )
    const krds = within(attribution as HTMLElement).getByRole('link', {
      name: 'KRDS 누리집',
    })
    expect(krds).toHaveAttribute('href', 'https://www.krds.go.kr')
    expect(krds).toHaveAttribute('target', '_blank')
    expect(krds).toHaveAttribute('rel', 'noopener noreferrer')
    expect(krds).toHaveAttribute('title', '새 창 열림')
  })
})

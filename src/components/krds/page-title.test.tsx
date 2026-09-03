import { describe, expect, it } from 'vitest'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import PageTitle from '@/components/krds/page-title'

describe('<PageTitle>', () => {
  it('renders the title as the level-1 heading of the page', () => {
    const { container } = renderWithChakra(<PageTitle title="법인 소개" />)
    const heading = screen.getByRole('heading', {
      level: 1,
      name: '법인 소개',
    })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H1')
    expect(heading).toHaveClass('h-tit')
    expect(container.querySelector('.page-title-wrap')).not.toBeNull()
    expect(container.querySelector('.page-title-wrap > h1.h-tit')).toBe(heading)
  })

  it('omits the info box when no description is given', () => {
    const { container } = renderWithChakra(<PageTitle title="공지사항" />)
    expect(container.querySelector('.g-info-box')).toBeNull()
    expect(container.querySelector('.g-desc')).toBeNull()
    expect(container.querySelector('.page-title-wrap')?.children.length).toBe(1)
  })

  it('renders the description inside .g-info-box > p.g-desc when given', () => {
    const { container } = renderWithChakra(
      <PageTitle
        title="사업 소개"
        description="STDev가 하는 일을 소개합니다."
      />,
    )
    const infoBox = container.querySelector('.g-info-box')
    expect(infoBox).not.toBeNull()
    const desc = infoBox?.querySelector('p.g-desc')
    expect(desc).not.toBeNull()
    expect(desc).toHaveTextContent('STDev가 하는 일을 소개합니다.')
    expect(
      screen.getByText('STDev가 하는 일을 소개합니다.'),
    ).toBeInTheDocument()
  })

  it('renders the heading before the description', () => {
    const { container } = renderWithChakra(
      <PageTitle title="설립 목적" description="설명 문구" />,
    )
    const wrap = container.querySelector('.page-title-wrap') as HTMLElement
    expect(wrap.children.length).toBe(2)
    expect(wrap.children[0]).toHaveClass('h-tit')
    expect(wrap.children[1]).toHaveClass('g-info-box')
  })

  it('accepts rich ReactNode content as the description', () => {
    const { container } = renderWithChakra(
      <PageTitle
        title="문의하기"
        description={
          <>
            자세한 내용은 <a href="mailto:hello@stdev.kr">메일</a>로 문의해
            주세요.
          </>
        }
      />,
    )
    const desc = container.querySelector('p.g-desc') as HTMLElement
    expect(desc).not.toBeNull()
    const link = within(desc).getByRole('link', { name: '메일' })
    expect(link).toHaveAttribute('href', 'mailto:hello@stdev.kr')
  })

  it('omits the info box when the description is an empty string', () => {
    const { container } = renderWithChakra(
      <PageTitle title="연혁" description="" />,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: '연혁' }),
    ).toBeInTheDocument()
    expect(container.querySelector('.g-info-box')).toBeNull()
    expect(container.querySelector('.g-desc')).toBeNull()
  })
})

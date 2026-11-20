import { describe, expect, it } from 'vitest'
import { render, screen } from '@/tests/utils/render'
import NotionPage from '@/components/notion/notion-page'

const COVER =
  'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/cover.png'

describe('<NotionPage>', () => {
  it('커버, 아이콘, 제목, 본문 순으로 article 안에 그린다', () => {
    const { container } = render(
      <NotionPage title="DSF 2026" icon="🚀" coverImageUrl={COVER}>
        <p data-testid="body">본문</p>
      </NotionPage>,
    )

    const article = container.querySelector('article.notion-page')!
    expect(container.firstElementChild).toBe(article)
    expect(
      Array.from(article.children).map((child) => child.className),
    ).toEqual(['notion-cover', 'notion-page-icon', 'notion-title', ''])
    expect(article.lastElementChild).toBe(screen.getByTestId('body'))
  })

  it('노션 제목을 페이지의 유일한 h1로 둔다', () => {
    render(
      <NotionPage title="DSF 2026" icon={null} coverImageUrl={null}>
        <h2>본문 제목</h2>
      </NotionPage>,
    )

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('DSF 2026')
    expect(headings[0]).toHaveClass('notion-title')
  })

  it('커버 이미지는 대체 텍스트 없는 장식 이미지로 그린다', () => {
    const { container } = render(
      <NotionPage title="제목" icon={null} coverImageUrl={COVER}>
        본문
      </NotionPage>,
    )

    const cover = container.querySelector('.notion-cover img')!
    expect(cover.getAttribute('src')).toContain(encodeURIComponent(COVER))
    expect(cover).toHaveAttribute('alt', '')
    // 장식 이미지라 접근성 트리에 이미지로 노출되지 않는다.
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('커버와 아이콘이 없으면 제목과 본문만 그린다', () => {
    const { container } = render(
      <NotionPage title="제목" icon={null} coverImageUrl={null}>
        <p>본문</p>
      </NotionPage>,
    )

    expect(container.querySelector('.notion-cover')).toBeNull()
    expect(container.querySelector('.notion-page-icon')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    const article = container.querySelector('article.notion-page')!
    expect(Array.from(article.children).map((child) => child.tagName)).toEqual([
      'H1',
      'P',
    ])
  })

  it('이모지 아이콘은 숨긴 span으로 그린다', () => {
    const { container } = render(
      <NotionPage title="제목" icon="🏆" coverImageUrl={null}>
        본문
      </NotionPage>,
    )

    const icon = container.querySelector('.notion-page-icon')!
    expect(icon.tagName).toBe('SPAN')
    expect(icon).toHaveTextContent('🏆')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('이미지 아이콘은 장식 img로 그린다', () => {
    const icon = '/images/business/icon.png'
    const { container } = render(
      <NotionPage title="제목" icon={icon} coverImageUrl={null}>
        본문
      </NotionPage>,
    )

    const image = container.querySelector('img.notion-page-icon')!
    expect(image).toHaveAttribute('src', icon)
    expect(image).toHaveAttribute('alt', '')
    expect(image).toHaveAttribute('aria-hidden', 'true')
  })

  it('안전하지 않은 이미지 아이콘은 빼고 제목은 그대로 둔다', () => {
    const { container } = render(
      <NotionPage
        title="제목"
        icon="//evil.example.com/icon.png"
        coverImageUrl={null}
      >
        본문
      </NotionPage>,
    )

    expect(container.querySelector('.notion-page-icon')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('제목')
  })
})

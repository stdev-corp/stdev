import type { Root, RootContent } from 'mdast'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@/tests/utils/render'
import NotionMarkdown, { NotionIcon } from '@/components/notion/notion-markdown'
import type { NotionPageLinks } from '@/utils/cms-types'

/*
 * remarkNotion은 실제 것을 그대로 쓰되, 플러그인이 걸러 주지 못한 요소가
 * 렌더러까지 왔을 때의 방어 동작을 보려고 변환 뒤에 노드를 덧붙일 수 있게 한다.
 */
const plugin = vi.hoisted(() => ({
  extra: [] as unknown[],
}))

vi.mock('@/utils/notion-markdown', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/utils/notion-markdown')>()
  return {
    ...actual,
    remarkNotion: () => {
      const transform = actual.remarkNotion()
      return (tree: Root) => {
        transform(tree)
        tree.children.push(...(plugin.extra as RootContent[]))
      }
    },
  }
})

/** 렌더러가 받는 hast 요소를 그대로 만드는 mdast 노드. */
function element(name: string, properties: Record<string, unknown> = {}) {
  return {
    type: 'paragraph',
    data: { hName: name, hProperties: properties },
    children: [],
  }
}

const S3 = 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com'
const PUBLIC_BASE = 'http://localhost:9000/stdev-kr'

function renderMarkdown(content: string, pageLinks?: NotionPageLinks) {
  const result = render(
    <NotionMarkdown content={content} pageLinks={pageLinks} />,
  )
  const root = result.container.querySelector('.notion-content') as HTMLElement
  return { ...result, root }
}

afterEach(() => {
  vi.unstubAllEnvs()
  plugin.extra = []
})

describe('<NotionMarkdown>', () => {
  it('본문을 .notion-content 하나로 감싼다', () => {
    const { container, root } = renderMarkdown('문단')

    expect(container.children).toHaveLength(1)
    expect(container.firstElementChild).toBe(root)
    expect(within(root).getByText('문단').tagName).toBe('P')
  })

  it('강제 줄바꿈 뒤의 원문 줄바꿈 글자를 남기지 않는다', () => {
    const { root } = renderMarkdown('첫 줄\\\n둘째 줄')

    const paragraph = root.querySelector('p')!
    const br = paragraph.querySelector('br')!
    expect(br).not.toBeNull()
    expect(br.previousSibling?.textContent).toBe('첫 줄')
    // pre-wrap 문단에서 줄이 두 번 바뀌지 않도록 '\n'이 지워져 있어야 한다.
    expect(br.nextSibling?.textContent).toBe('둘째 줄')
  })

  describe('각주', () => {
    it('각주 제목은 숨긴 채 그대로 두고 목차에 넣지 않는다', () => {
      const { container } = render(
        <NotionMarkdown
          content={'## 본문 제목\n\n글[^1]\n\n[^1]: 각주 내용\n\n::toc'}
        />,
      )
      const label = container.querySelector('#footnote-label')
      expect(label?.tagName).toBe('H2')
      expect(label).toHaveClass('sr-only')
      expect(label).toHaveTextContent('각주')
      const toc = container.querySelector('nav.notion-toc')!
      expect(within(toc as HTMLElement).getAllByRole('link')).toHaveLength(1)
      expect(within(toc as HTMLElement).queryByText('각주')).toBeNull()
      expect(
        container.querySelector('[data-footnote-backref]'),
      ).toHaveAttribute('aria-label', '본문으로 돌아가기')
    })
  })

  describe('제목', () => {
    it('페이지 h1을 노션 제목에 남겨 두도록 본문 제목을 한 단계씩 내린다', () => {
      const { root } = renderMarkdown('# 하나\n\n## 둘\n\n### 셋')

      expect(root.querySelector('h1')).toBeNull()
      const one = screen.getByRole('heading', { level: 2, name: '하나' })
      const two = screen.getByRole('heading', { level: 3, name: '둘' })
      const three = screen.getByRole('heading', { level: 4, name: '셋' })
      expect(one).toHaveClass('notion-h1')
      expect(two).toHaveClass('notion-h2')
      expect(three).toHaveClass('notion-h3')
      // 목차가 가리킬 수 있도록 제목 1~3에는 id가 붙는다.
      expect(one).toHaveAttribute('id', '하나')
      expect(two).toHaveAttribute('id', '둘')
      expect(three).toHaveAttribute('id', '셋')
    })

    it('노션에 없는 제목 4~6은 모두 제목 3 모양(h4)으로 그린다', () => {
      const { root } = renderMarkdown('#### 넷\n\n##### 다섯\n\n###### 여섯')

      const headings = Array.from(root.querySelectorAll('h4'))
      expect(headings.map((heading) => heading.textContent)).toEqual([
        '넷',
        '다섯',
        '여섯',
      ])
      headings.forEach((heading) => {
        expect(heading).toHaveClass('notion-h3')
        expect(heading.className).toBe('notion-h3')
      })
      expect(root.querySelector('h5, h6')).toBeNull()
    })

    it('::toc 목차의 링크가 내려 그린 제목의 id를 가리킨다', () => {
      const { root } = renderMarkdown('# 개요\n\n## 일정\n\n::toc')

      const toc = screen.getByRole('navigation', { name: '목차' })
      expect(toc).toHaveClass('notion-toc')
      const links = within(toc).getAllByRole('link')
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '#개요',
        '#일정',
      ])
      links.forEach((link) => {
        expect(link).toHaveClass('notion-link')
        expect(link).not.toHaveAttribute('target')
        const target = root.querySelector(
          `[id="${link.getAttribute('href')!.slice(1)}"]`,
        )
        expect(target?.tagName).toMatch(/^H[23]$/)
      })
    })
  })

  describe('링크', () => {
    it('사이트 내부 경로와 앵커는 같은 창에서 연다', () => {
      renderMarkdown('[행사](/hackathon/dsf26) [위로](#top)')

      for (const [name, href] of [
        ['행사', '/hackathon/dsf26'],
        ['위로', '#top'],
      ]) {
        const link = screen.getByRole('link', { name })
        expect(link).toHaveAttribute('href', href)
        expect(link).toHaveClass('notion-link')
        expect(link).not.toHaveAttribute('target')
        expect(link).not.toHaveAttribute('rel')
      }
    })

    it('https 외부 링크는 새 창으로 열고 opener를 끊는다', () => {
      renderMarkdown('[누리집](https://example.com/path "설명")')

      const link = screen.getByRole('link', { name: '누리집' })
      expect(link).toHaveAttribute('href', 'https://example.com/path')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      // 사이트의 다른 새 창 링크처럼 새 창 알림을 단다.
      expect(link).toHaveAttribute('title', '설명 - 새 창 열림')
      expect(link).toHaveClass('notion-link')
    })

    it('제목 없는 외부 링크와 북마크에도 새 창 알림을 단다', () => {
      const { root } = renderMarkdown(
        '[외부](https://example.com)\n\n::bookmark{url="https://example.com/b" title="북마크"}',
      )
      expect(screen.getByRole('link', { name: '외부' })).toHaveAttribute(
        'title',
        '새 창 열림',
      )
      expect(root.querySelector('a.notion-bookmark')).toHaveAttribute(
        'title',
        '새 창 열림',
      )
    })

    it('openLinksInNewTab이면 내부 링크·북마크·하위 페이지 링크도 새 창으로 연다', () => {
      const { container: root } = render(
        <NotionMarkdown
          openLinksInNewTab
          content={
            '[소개](/intro/about)\n\n::bookmark{url="/intro/history" title="연혁"}\n\n::page{path="faq"}'
          }
          pageLinks={{
            ':faq': { href: '/hackathon/dsf26/faq', title: 'FAQ', icon: null },
          }}
        />,
      )
      expect(screen.getByRole('link', { name: '소개' })).toHaveAttribute(
        'target',
        '_blank',
      )
      expect(root.querySelector('a.notion-bookmark')).toHaveAttribute(
        'target',
        '_blank',
      )
      expect(screen.getByRole('link', { name: /FAQ/ })).toHaveAttribute(
        'target',
        '_blank',
      )
    })

    it('mailto 링크는 허용하되 새 창으로 열지 않는다', () => {
      renderMarkdown('[메일 보내기](mailto:info@stdev.kr)')

      const link = screen.getByRole('link', { name: '메일 보내기' })
      expect(link).toHaveAttribute('href', 'mailto:info@stdev.kr')
      expect(link).toHaveClass('notion-link')
      expect(link).not.toHaveAttribute('target')
    })

    it('javascript, tel, 프로토콜 상대 주소와 빈 주소는 링크 없이 글자만 남긴다', () => {
      const { root } = renderMarkdown(
        [
          '[스크립트](javascript:alert(1))',
          '[전화](tel:0212345678)',
          '[상대](//evil.example.com)',
          '[빈칸]()',
        ].join(' '),
      )

      expect(root.querySelector('a')).toBeNull()
      for (const text of ['스크립트', '전화', '상대', '빈칸']) {
        const element = within(root).getByText(text)
        expect(element.tagName).toBe('SPAN')
        expect(element).not.toHaveAttribute('href')
      }
    })

    it('링크 안의 서식은 그대로 둔다', () => {
      renderMarkdown('[**굵은** 링크](/intro/about)')

      const link = screen.getByRole('link', { name: '굵은 링크' })
      expect(link.querySelector('strong')).toHaveTextContent('굵은')
    })
  })

  describe('이미지', () => {
    it('https와 내부 경로 이미지는 지연 로드로 그리고 대체 텍스트를 지킨다', () => {
      const { root } = renderMarkdown(
        `![포스터](${S3}/images/poster.png) ![](/images/intro/logo.png)`,
      )

      const images = Array.from(root.querySelectorAll('img'))
      expect(images).toHaveLength(2)
      // S3 이미지는 Next 이미지 최적화 주소와 srcSet으로 그린다.
      expect(images[0].getAttribute('src')).toMatch(
        new RegExp(
          `^/_next/image\\?url=${encodeURIComponent(`${S3}/images/poster.png`).replace(/[.?]/g, '\\$&')}&w=\\d+&q=75$`,
        ),
      )
      expect(images[0].getAttribute('srcset')).toContain('640w')
      expect(images[0]).toHaveAttribute(
        'sizes',
        '(max-width: 1023px) calc(100vw - 32px), 900px',
      )
      expect(images[0]).toHaveAttribute('alt', '포스터')
      expect(images[0]).toHaveAttribute('loading', 'lazy')
      expect(images[1]).toHaveAttribute('src', '/images/intro/logo.png')
      expect(images[1]).toHaveAttribute('alt', '')
    })

    it('S3_PUBLIC_BASE_URL이 있으면 S3 이미지만 공개 주소로 바꾼다', () => {
      vi.stubEnv('S3_PUBLIC_BASE_URL', `${PUBLIC_BASE}/`)
      const { root } = renderMarkdown(
        `![s3](${S3}/images/a.png?v=2) ![외부](https://cdn.example.com/b.png)`,
      )

      const [s3, external] = Array.from(root.querySelectorAll('img'))
      expect(s3.getAttribute('src')).toContain(
        encodeURIComponent(`${PUBLIC_BASE}/images/a.png?v=2`),
      )
      expect(external).toHaveAttribute('src', 'https://cdn.example.com/b.png')
    })

    it('안전하지 않은 주소의 이미지는 아예 그리지 않는다', () => {
      const { root } = renderMarkdown(
        [
          '![평문](http://example.com/a.png)',
          '![상대](//evil.example.com/a.png)',
          '![데이터](data:image/png;base64,AAAA)',
          '![빈칸]()',
        ].join(' '),
      )

      expect(root.querySelector('img')).toBeNull()
      expect(screen.queryByRole('img')).toBeNull()
    })
  })

  describe('블록 요소', () => {
    it('인용, 구분선, 코드 블록에 노션 클래스를 붙인다', () => {
      const { root } = renderMarkdown(
        '> 인용문\n\n---\n\n```js\nconst a = 1\n```',
      )

      const quote = root.querySelector('blockquote')!
      expect(quote).toHaveClass('notion-quote')
      expect(quote).toHaveTextContent('인용문')
      // KRDS가 <hr>을 감추므로 구분선은 separator 역할의 div로 그린다.
      expect(root.querySelector('hr')).toBeNull()
      const divider = screen.getByRole('separator')
      expect(divider.tagName).toBe('DIV')
      expect(divider).toHaveClass('notion-divider')
      expect(divider).toBeEmptyDOMElement()
      const pre = root.querySelector('pre')!
      expect(pre).toHaveClass('notion-code')
      expect(pre.querySelector('code')).toHaveClass('language-js')
      expect(pre).toHaveTextContent('const a = 1')
    })

    it('표는 가로 스크롤 상자로 감싼다', () => {
      const { root } = renderMarkdown(
        '| 항목 | 값 |\n| - | - |\n| 장소 | 서울 |',
      )

      const scroll = root.querySelector('div.notion-table-scroll')!
      expect(scroll).not.toBeNull()
      const table = within(scroll as HTMLElement).getByRole('table')
      expect(scroll.children).toHaveLength(1)
      expect(scroll.firstElementChild).toBe(table)
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((cell) => cell.textContent),
      ).toEqual(['항목', '값'])
      expect(within(table).getByRole('cell', { name: '서울' })).toBeVisible()
    })
  })

  describe('노션 표 설정 (:::table)', () => {
    const gfm = '| 이름 | 소속 |\n| - | - |\n| 홍길동 | STDev |'

    function cellTexts(row: HTMLElement) {
      return Array.from(row.querySelectorAll('th, td')).map(
        (cell) => cell.textContent,
      )
    }

    it('머리글 없는 표는 첫 줄도 본문 칸으로 그려 열 머리글로 읽히지 않는다', () => {
      const { root } = renderMarkdown(`:::table{header-row=false}\n${gfm}\n:::`)

      const table = screen.getByRole('table')
      expect(root.querySelector('thead')).toBeNull()
      expect(within(table).queryAllByRole('columnheader')).toHaveLength(0)
      const rows = within(table).getAllByRole('row')
      expect(rows.map(cellTexts)).toEqual([
        ['이름', '소속'],
        ['홍길동', 'STDev'],
      ])
      expect(within(rows[0]).getAllByRole('cell')).toHaveLength(2)
    })

    it('머리글 열이 있는 표는 줄마다 첫 칸을 줄 머리글로 그린다', () => {
      renderMarkdown(
        `:::table{header-column=true}\n${gfm}\n| 김철수 | KAIST |\n:::`,
      )

      const table = screen.getByRole('table')
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((cell) => cell.textContent),
      ).toEqual(['이름', '소속'])
      const rowHeaders = within(table).getAllByRole('rowheader')
      expect(rowHeaders.map((cell) => cell.textContent)).toEqual([
        '홍길동',
        '김철수',
      ])
      rowHeaders.forEach((cell) => {
        expect(cell.tagName).toBe('TH')
        expect(cell).toHaveAttribute('scope', 'row')
      })
      expect(
        within(table)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      ).toEqual(['STDev', 'KAIST'])
    })

    it('widths가 있으면 열 폭과 표 폭을 정하고 가로 스크롤 상자는 그대로 둔다', () => {
      const { root } = renderMarkdown(`:::table{widths="120,373"}\n${gfm}\n:::`)

      const wrapper = root.querySelector('div.notion-table')!
      expect(wrapper).toHaveClass('notion-table', 'has-widths')
      expect(wrapper).not.toHaveAttribute('data-widths')
      const table = screen.getByRole('table')
      expect(table.parentElement).toHaveClass('notion-table-scroll')
      // 표 폭은 CSS가 min(노션 폭 합, 본문 폭)으로 정하고, 열은 비율을 지킨다.
      expect(table.style.getPropertyValue('--notion-table-width')).toBe('493px')
      const cols = Array.from(table.querySelectorAll('colgroup > col'))
      expect(cols.map((col) => (col as HTMLElement).style.width)).toEqual([
        '24.341%',
        '75.659%',
      ])
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((cell) => cell.textContent),
      ).toEqual(['이름', '소속'])
    })

    it('잘못된 widths는 무시하고 본문 폭 표로 그린다', () => {
      const { root } = renderMarkdown(
        `:::table{widths="120px,373px"}\n${gfm}\n:::`,
      )

      const wrapper = root.querySelector('div.notion-table')!
      expect(wrapper).not.toHaveClass('has-widths')
      expect(wrapper).not.toHaveAttribute('data-widths')
      expect(root.querySelector('colgroup')).toBeNull()
      expect(screen.getByRole('table')).not.toHaveAttribute('style')
    })
  })

  describe('콜아웃', () => {
    it('이모지 아이콘과 색을 가진 콜아웃을 그린다', () => {
      const { root } = renderMarkdown(
        ':::callout{icon="💡" color="blue_background"}\n알림 내용\n:::',
      )

      const callout = root.querySelector('div.notion-callout')!
      expect(callout).toHaveClass('notion-callout', 'notion-blue_background')
      const icon = callout.querySelector('.notion-callout-icon')!
      expect(icon.tagName).toBe('SPAN')
      expect(icon).toHaveTextContent('💡')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(callout.querySelector('.notion-callout-text')).toHaveTextContent(
        '알림 내용',
      )
    })

    it('이미지 아이콘은 장식용 img로 그린다', () => {
      const { root } = renderMarkdown(
        `:::callout{icon="${S3}/images/icon.png"}\n이미지 아이콘\n:::`,
      )

      const icon = root.querySelector('.notion-callout-icon')!
      expect(icon.tagName).toBe('IMG')
      expect(icon).toHaveAttribute('src', `${S3}/images/icon.png`)
      expect(icon).toHaveAttribute('alt', '')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('안전하지 않은 이미지 아이콘이나 빈 아이콘은 빼고 내용만 남긴다', () => {
      const { root } = renderMarkdown(
        ':::callout{icon="//evil.example.com/x.png"}\n위험\n:::\n\n:::callout\n아이콘 없음\n:::',
      )

      const callouts = root.querySelectorAll('div.notion-callout')
      expect(callouts).toHaveLength(2)
      expect(root.querySelector('.notion-callout-icon')).toBeNull()
      expect(root.querySelector('img')).toBeNull()
      expect(callouts[0]).toHaveTextContent('위험')
      expect(callouts[1]).toHaveClass('notion-gray_background')
      expect(callouts[1]).toHaveTextContent('아이콘 없음')
    })
  })

  describe('토글', () => {
    it('토글은 details/summary로, 제목 토글은 제목 모양 클래스를 더한다', () => {
      const { root } = renderMarkdown(
        ':::toggle[자주 묻는 질문]\n답변\n:::\n\n:::toggle[큰 토글]{heading=2}\n내용\n:::',
      )

      const toggles = Array.from(root.querySelectorAll('details'))
      expect(toggles).toHaveLength(2)
      toggles.forEach((toggle) => expect(toggle).toHaveClass('notion-toggle'))

      const [plain, headed] = toggles.map((toggle) =>
        toggle.querySelector('summary')!,
      )
      expect(plain.className).toBe('notion-toggle-summary')
      expect(plain).toHaveTextContent('자주 묻는 질문')
      expect(headed.className).toBe('notion-toggle-summary notion-h2')
      expect(headed).toHaveTextContent('큰 토글')
      expect(toggles[0]).toHaveTextContent('답변')
      expect(toggles[0]).not.toHaveAttribute('open')
    })
  })

  describe('페이지 링크', () => {
    const pageLinks: NotionPageLinks = {
      ':faq': {
        href: '/hackathon/dsf26/faq',
        title: '자주 묻는 질문',
        icon: '❓',
      },
      'dsf25:': { href: '/hackathon/dsf25', title: 'DSF 2025', icon: null },
      ':notice': {
        href: '/hackathon/dsf26/notice',
        title: '공지',
        icon: `${S3}/images/notice.png`,
      },
    }

    it('::page를 표에서 찾은 주소와 제목, 아이콘으로 그린다', () => {
      renderMarkdown('::page{path="faq"}', pageLinks)

      const link = screen.getByRole('link', { name: '자주 묻는 질문' })
      expect(link).toHaveAttribute('href', '/hackathon/dsf26/faq')
      expect(link).not.toHaveAttribute('target')
      expect(link.parentElement).toHaveClass('notion-page-link')
      expect(link.parentElement!.tagName).toBe('P')
      expect(link.querySelector('.notion-page-link-icon')).toHaveTextContent(
        '❓',
      )
      expect(link.querySelector('.notion-page-link-title')).toHaveTextContent(
        '자주 묻는 질문',
      )
    })

    it('아이콘이 없는 페이지에는 기본 문서 아이콘을 붙인다', () => {
      renderMarkdown('::page{event="dsf25"}', pageLinks)

      const link = screen.getByRole('link', { name: 'DSF 2025' })
      expect(link).toHaveAttribute('href', '/hackathon/dsf25')
      expect(link.querySelector('.notion-page-link-icon')).toHaveTextContent(
        '📄',
      )
    })

    it('이미지 아이콘 페이지는 img 아이콘을 쓴다', () => {
      renderMarkdown('::page{path="notice"}', pageLinks)

      const link = screen.getByRole('link', { name: '공지' })
      const icon = link.querySelector('img.notion-page-link-icon')
      expect(icon).toHaveAttribute('src', `${S3}/images/notice.png`)
    })

    it('표에 없는 페이지나 표가 없는 경우에는 아무것도 그리지 않는다', () => {
      const { root, unmount } = renderMarkdown(
        '앞\n\n::page{path="missing"}\n\n뒤',
        pageLinks,
      )
      expect(root.querySelector('.notion-page-link')).toBeNull()
      expect(within(root).getByText('앞')).toBeInTheDocument()
      expect(within(root).getByText('뒤')).toBeInTheDocument()
      unmount()

      const withoutLinks = renderMarkdown('::page{path="faq"}')
      expect(withoutLinks.root.querySelector('.notion-page-link')).toBeNull()
      expect(screen.queryByRole('link')).toBeNull()
    })

    it('showMissingPageLinks면 표에 없는 링크를 찾을 수 없는 하위 페이지로 표시한다', () => {
      const { container } = render(
        <NotionMarkdown
          showMissingPageLinks
          content={[
            '::page{path="faq"}',
            '::page{path="notice/team"}',
            '::page{event="dsf24" path="faq"}',
            '::page{event="dsf23"}',
          ].join('\n\n')}
          pageLinks={pageLinks}
        />,
      )

      // 표에 있는 링크는 평소처럼 그린다.
      expect(
        screen.getByRole('link', { name: '자주 묻는 질문' }),
      ).toHaveAttribute('href', '/hackathon/dsf26/faq')
      expect(screen.getAllByRole('link')).toHaveLength(1)

      const missing = Array.from(
        container.querySelectorAll('.notion-page-link-missing'),
      )
      expect(missing.map((placeholder) => placeholder.textContent)).toEqual([
        // 같은 행사 안이면 경로만, 다른 행사면 '행사/경로'로 보인다.
        '찾을 수 없는 하위 페이지: notice/team',
        '찾을 수 없는 하위 페이지: dsf24/faq',
        '찾을 수 없는 하위 페이지: dsf23',
      ])
      missing.forEach((placeholder) => {
        expect(placeholder.tagName).toBe('P')
        expect(placeholder).toHaveClass('notion-page-link')
        expect(placeholder.querySelector('a')).toBeNull()
        expect(
          placeholder.querySelector('.notion-page-link-title')?.textContent,
        ).toBe(placeholder.textContent)
      })
    })

    it('showMissingPageLinks에 링크 표가 없으면 모든 ::page를 찾을 수 없다고 표시한다', () => {
      const { container } = render(
        <NotionMarkdown showMissingPageLinks content={'::page{path="faq"}'} />,
      )

      expect(screen.queryByRole('link')).toBeNull()
      expect(
        container.querySelector('p.notion-page-link-missing'),
      ).toHaveTextContent(/^찾을 수 없는 하위 페이지: faq$/)
    })
  })

  describe('이미지 블록', () => {
    it('폭과 캡션이 있는 이미지 블록을 figure로 그린다', () => {
      const { root } = renderMarkdown(
        `::image{src="${S3}/images/a.png" alt="행사 사진" width=240 caption="개회식"}`,
      )

      const figure = root.querySelector('figure.notion-image')!
      const image = figure.querySelector('img')!
      expect(image.getAttribute('src')).toContain(
        encodeURIComponent(`${S3}/images/a.png`),
      )
      // 정해진 폭으로 보이는 이미지라 그 폭에 맞는 후보만 고른다.
      expect(image).toHaveAttribute('sizes', '240px')
      expect(image).toHaveAttribute('alt', '행사 사진')
      expect(image).toHaveAttribute('loading', 'lazy')
      expect(image.style.width).toBe('240px')
      expect(figure.querySelector('figcaption')).toHaveTextContent('개회식')
    })

    it('폭과 캡션이 없으면 원래 크기로 그리고 캡션을 두지 않는다', () => {
      const { root } = renderMarkdown('::image{src="/images/b.png"}')

      const figure = root.querySelector('figure.notion-image')!
      const image = figure.querySelector('img')!
      expect(image).toHaveAttribute('src', '/images/b.png')
      expect(image).toHaveAttribute('alt', '')
      expect(image).not.toHaveAttribute('style')
      expect(figure.querySelector('figcaption')).toBeNull()
    })

    it('S3 이미지 블록도 공개 주소로 바꾼다', () => {
      vi.stubEnv('S3_PUBLIC_BASE_URL', PUBLIC_BASE)
      const { root } = renderMarkdown(`::image{src="${S3}/images/c.png"}`)

      expect(
        root.querySelector('figure.notion-image img')?.getAttribute('src'),
      ).toContain(encodeURIComponent(`${PUBLIC_BASE}/images/c.png`))
    })
  })

  describe('북마크', () => {
    it('외부 북마크는 제목, 설명, 파비콘, 미리보기 이미지와 함께 새 창으로 연다', () => {
      const { root } = renderMarkdown(
        `::bookmark{url="https://example.com/post" title="예제 글" description="글 설명" image="${S3}/images/og.png" icon="https://example.com/favicon.png"}`,
      )

      const bookmark = root.querySelector('a.notion-bookmark')!
      expect(bookmark).toHaveAttribute('href', 'https://example.com/post')
      expect(bookmark).toHaveAttribute('target', '_blank')
      expect(bookmark).toHaveAttribute('rel', 'noopener noreferrer')
      expect(
        bookmark.querySelector('.notion-bookmark-title'),
      ).toHaveTextContent('예제 글')
      expect(
        bookmark.querySelector('.notion-bookmark-description'),
      ).toHaveTextContent('글 설명')

      const url = bookmark.querySelector('.notion-bookmark-url')!
      expect(url).toHaveTextContent('https://example.com/post')
      const favicon = url.querySelector('img')!
      expect(favicon).toHaveAttribute('src', 'https://example.com/favicon.png')
      expect(favicon).toHaveAttribute('alt', '')
      expect(favicon).toHaveAttribute('aria-hidden', 'true')

      const preview = bookmark.querySelector('.notion-bookmark-image img')!
      expect(preview).toHaveAttribute('src', `${S3}/images/og.png`)
      expect(preview).toHaveAttribute('loading', 'lazy')
    })

    it('내부 주소 북마크는 같은 창에서 열고, 빠진 항목은 그리지 않는다', () => {
      const { root } = renderMarkdown('::bookmark{url="/hackathon/dsf26"}')

      const bookmark = root.querySelector('a.notion-bookmark')!
      expect(bookmark).toHaveAttribute('href', '/hackathon/dsf26')
      expect(bookmark).not.toHaveAttribute('target')
      expect(bookmark).not.toHaveAttribute('rel')
      // 제목이 없으면 주소를 제목으로 쓴다.
      expect(
        bookmark.querySelector('.notion-bookmark-title'),
      ).toHaveTextContent('/hackathon/dsf26')
      expect(bookmark.querySelector('.notion-bookmark-description')).toBeNull()
      expect(bookmark.querySelector('.notion-bookmark-image')).toBeNull()
      expect(bookmark.querySelector('img')).toBeNull()
    })

    it('북마크의 S3 미리보기와 아이콘도 공개 주소로 바꾼다', () => {
      vi.stubEnv('S3_PUBLIC_BASE_URL', PUBLIC_BASE)
      const { root } = renderMarkdown(
        `::bookmark{url="https://example.com" image="${S3}/images/og.png" icon="${S3}/images/fav.png"}`,
      )

      expect(root.querySelector('.notion-bookmark-image img')).toHaveAttribute(
        'src',
        `${PUBLIC_BASE}/images/og.png`,
      )
      expect(root.querySelector('.notion-bookmark-url img')).toHaveAttribute(
        'src',
        `${PUBLIC_BASE}/images/fav.png`,
      )
    })
  })

  describe('동영상과 삽입', () => {
    it('동영상은 컨트롤이 있는 video로 그린다', () => {
      vi.stubEnv('S3_PUBLIC_BASE_URL', PUBLIC_BASE)
      const { root } = renderMarkdown(
        `::video{src="${S3}/videos/teaser.mp4"}\n\n::video{src="https://example.com/v.mp4"}`,
      )

      const videos = Array.from(root.querySelectorAll('video'))
      expect(videos).toHaveLength(2)
      expect(videos[0]).toHaveAttribute(
        'src',
        `${PUBLIC_BASE}/videos/teaser.mp4`,
      )
      expect(videos[1]).toHaveAttribute('src', 'https://example.com/v.mp4')
      videos.forEach((video) => {
        expect(video).toHaveClass('notion-video')
        expect(video).toHaveAttribute('controls')
        expect(video).toHaveAttribute('preload', 'metadata')
      })
    })

    it('허용된 지도·동영상 주소를 제목과 높이를 가진 iframe으로 그린다', () => {
      const { root } = renderMarkdown(
        '::embed{src="https://www.youtube.com/embed/abc" height=400 title="소개 영상"}\n\n::embed{src="https://www.google.com/maps/embed?pb=1"}',
      )

      const [video, map] = Array.from(root.querySelectorAll('iframe'))
      expect(video).toHaveClass('notion-embed')
      expect(video).toHaveAttribute('src', 'https://www.youtube.com/embed/abc')
      expect(video).toHaveAttribute('title', '소개 영상')
      expect(video).toHaveAttribute('height', '400')
      expect(video).toHaveAttribute('loading', 'lazy')
      expect(video).toHaveAttribute(
        'referrerpolicy',
        'no-referrer-when-downgrade',
      )
      expect(video).toHaveAttribute('allowfullscreen')
      // 높이와 제목이 없으면 기본값을 쓴다.
      expect(map).toHaveAttribute(
        'src',
        'https://www.google.com/maps/embed?pb=1',
      )
      expect(map).toHaveAttribute('height', '320')
      expect(map).toHaveAttribute('title', '삽입된 지도 또는 동영상')
    })

    it('허용되지 않은 동영상·삽입·이미지 블록은 원문 없이 빠진다', () => {
      const { root } = renderMarkdown(
        [
          '::video{src="http://example.com/v.mp4"}',
          '::embed{src="https://evil.example.com/embed"}',
          '::image{src="javascript:alert(1)"}',
          '::bookmark{url="ftp://example.com"}',
          '남은 문단',
        ].join('\n\n'),
      )

      expect(root.querySelector('video, iframe, figure, a')).toBeNull()
      expect(root).toHaveTextContent(/^남은 문단$/)
    })
  })
})

describe('<NotionMarkdown> 렌더러의 자체 검사', () => {
  it('플러그인을 거치지 않은 안전하지 않은 이미지·동영상 블록도 그리지 않는다', () => {
    plugin.extra = [
      element('notion-image', { src: 'javascript:alert(1)', alt: 'x' }),
      element('notion-image', { src: '//evil.example.com/a.png' }),
      element('notion-video', { src: 'http://example.com/v.mp4' }),
      element('notion-video'),
    ]
    const { root } = renderMarkdown('본문')

    expect(root.querySelector('figure, img, video')).toBeNull()
    expect(root).toHaveTextContent(/^본문$/)
  })

  it('대체 텍스트가 빠진 이미지는 빈 대체 텍스트로 장식 처리한다', () => {
    plugin.extra = [
      element('notion-image', { src: '/images/a.png' }),
      element('img', { src: '/images/b.png' }),
    ]
    const { root } = renderMarkdown('')

    const images = Array.from(root.querySelectorAll('img'))
    expect(images.map((image) => image.getAttribute('src'))).toEqual([
      '/images/a.png',
      '/images/b.png',
    ])
    images.forEach((image) => expect(image).toHaveAttribute('alt', ''))
  })

  it('주소가 없는 이미지는 그리지 않는다', () => {
    plugin.extra = [element('img', { alt: '주소 없음' })]
    const { root } = renderMarkdown('')

    expect(root.querySelector('img')).toBeNull()
  })

  it('키가 없는 페이지 링크는 빈 키로도 찾지 않는다', () => {
    plugin.extra = [element('notion-page-link')]
    const { root } = renderMarkdown('', {
      ':faq': { href: '/hackathon/dsf26/faq', title: 'FAQ', icon: null },
    })

    expect(root.querySelector('.notion-page-link')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('<NotionIcon>', () => {
  it('아이콘이 없으면 아무것도 그리지 않는다', () => {
    for (const icon of [null, undefined, '']) {
      const { container, unmount } = render(<NotionIcon icon={icon} />)
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })

  it('이모지는 보조기술에서 숨긴 span으로 그린다', () => {
    const { container } = render(<NotionIcon icon="🚀" className="icon" />)

    const span = container.firstElementChild!
    expect(span.tagName).toBe('SPAN')
    expect(span).toHaveClass('icon')
    expect(span).toHaveTextContent('🚀')
    expect(span).toHaveAttribute('aria-hidden', 'true')
  })

  it('https와 내부 경로 이미지 아이콘은 장식용 img로 그린다', () => {
    for (const icon of [`${S3}/images/icon.png`, '/images/icon.png']) {
      const { container, unmount } = render(
        <NotionIcon icon={icon} className="icon" />,
      )
      const image = container.firstElementChild!
      expect(image.tagName).toBe('IMG')
      expect(image).toHaveAttribute('src', icon)
      expect(image).toHaveAttribute('alt', '')
      expect(image).toHaveAttribute('aria-hidden', 'true')
      expect(image).toHaveClass('icon')
      unmount()
    }
  })

  it('S3 이미지 아이콘은 공개 주소로 바꾼다', () => {
    vi.stubEnv('S3_PUBLIC_BASE_URL', PUBLIC_BASE)
    const { container } = render(<NotionIcon icon={`${S3}/images/icon.png`} />)

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      `${PUBLIC_BASE}/images/icon.png`,
    )
  })

  it('프로토콜 상대 주소처럼 안전하지 않은 이미지 아이콘은 그리지 않는다', () => {
    for (const icon of ['//evil.example.com/x.png', 'https://']) {
      const { container, unmount } = render(<NotionIcon icon={icon} />)
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })
})

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import NotionMarkdown from '@/components/notion/notion-markdown'
import type { NotionPageLinks } from '@/utils/cms-types'
import {
  NOTION_COLORS,
  collectPageRefs,
  isNotionColor,
  pageLinkKey,
  safeEmbedUrl,
  safeLinkUrl,
  safeUrl,
} from '@/utils/notion-markdown'

/** 실제 렌더러(remarkNotion + rehypeNotionToc)를 거친 HTML. */
function html(content: string, pageLinks?: NotionPageLinks) {
  return renderToStaticMarkup(
    createElement(NotionMarkdown, { content, pageLinks }),
  )
}

/** HTML에서 .notion-content 안쪽만 떼어 낸다. React가 앞에 붙이는 preload 링크는 뺀다. */
function body(content: string, pageLinks?: NotionPageLinks) {
  const match = /<div class="notion-content">([\s\S]*)<\/div>$/.exec(
    html(content, pageLinks),
  )
  return match ? match[1] : ''
}

function dom(content: string, pageLinks?: NotionPageLinks) {
  const container = document.createElement('div')
  container.innerHTML = html(content, pageLinks)
  return container.querySelector('.notion-content') as HTMLElement
}

describe('isNotionColor', () => {
  it('노션 기본 색과 배경색을 받아들인다', () => {
    for (const color of NOTION_COLORS) {
      expect(isNotionColor(color)).toBe(true)
      expect(isNotionColor(`${color}_background`)).toBe(true)
    }
  })

  it('목록에 없는 색, 대소문자 다른 값, 문자열이 아닌 값은 거부한다', () => {
    expect(isNotionColor('neon')).toBe(false)
    expect(isNotionColor('neon_background')).toBe(false)
    expect(isNotionColor('Red')).toBe(false)
    expect(isNotionColor('_background')).toBe(false)
    expect(isNotionColor('red_background_background')).toBe(false)
    expect(isNotionColor('')).toBe(false)
    expect(isNotionColor(undefined)).toBe(false)
    expect(isNotionColor(null)).toBe(false)
    expect(isNotionColor(1)).toBe(false)
  })
})

describe('safeLinkUrl', () => {
  it('https·내부 경로에 더해 http와 mailto 링크를 허용한다', () => {
    expect(safeLinkUrl('https://a.example')).toBe('https://a.example')
    expect(safeLinkUrl('/intro/about')).toBe('/intro/about')
    expect(safeLinkUrl('http://a.example/x')).toBe('http://a.example/x')
    expect(safeLinkUrl('mailto:contact@stdev.kr')).toBe(
      'mailto:contact@stdev.kr',
    )
  })

  it('다른 스킴과 잘못된 값은 거부한다', () => {
    expect(safeLinkUrl('javascript:alert(1)')).toBeNull()
    expect(safeLinkUrl('tel:0212345678')).toBeNull()
    expect(safeLinkUrl('//evil.example.com')).toBeNull()
    expect(safeLinkUrl('not a url')).toBeNull()
    expect(safeLinkUrl(undefined)).toBeNull()
  })
})

describe('safeUrl', () => {
  it('https 주소는 그대로 둔다', () => {
    expect(safeUrl('https://example.com/a?b=1#c')).toBe(
      'https://example.com/a?b=1#c',
    )
  })

  it('사이트 내부 경로와 문서 안 앵커를 허용한다', () => {
    expect(safeUrl('/intro/about')).toBe('/intro/about')
    expect(safeUrl('/')).toBe('/')
    expect(safeUrl('#section')).toBe('#section')
    expect(safeUrl('/hackathon/dsf26?x=1#y')).toBe('/hackathon/dsf26?x=1#y')
  })

  it('브라우저가 다른 사이트로 읽는 경로(//, /\\)와 공백·제어 문자를 거부한다', () => {
    expect(safeUrl('//evil.com')).toBeNull()
    expect(safeUrl('/\\evil.com')).toBeNull()
    expect(safeUrl('/a\\b')).toBeNull()
    expect(safeUrl('/a b')).toBeNull()
    expect(safeUrl('/a\tb')).toBeNull()
    expect(safeUrl('#a b')).toBeNull()
  })

  it('프로토콜 상대 주소(//host)는 막는다', () => {
    expect(safeUrl('//evil.example.com/x')).toBeNull()
  })

  it.each([
    'http://example.com',
    'javascript:alert(1)',
    'data:text/html,hi',
    'mailto:a@b.c',
    'ftp://example.com/file',
    'relative/path',
    'not a url',
  ])('%j는 막는다', (value) => {
    expect(safeUrl(value)).toBeNull()
  })

  it('빈 문자열이나 문자열이 아닌 값은 null', () => {
    expect(safeUrl('')).toBeNull()
    expect(safeUrl(undefined)).toBeNull()
    expect(safeUrl(null)).toBeNull()
    expect(safeUrl(42)).toBeNull()
  })
})

describe('safeEmbedUrl', () => {
  it('구글 지도 주소를 허용한다', () => {
    expect(safeEmbedUrl('https://www.google.com/maps/embed?pb=1')).toBe(
      'https://www.google.com/maps/embed?pb=1',
    )
    expect(safeEmbedUrl('https://maps.google.com/maps?q=KAIST')).toBe(
      'https://maps.google.com/maps?q=KAIST',
    )
  })

  it('유튜브 embed 주소를 허용한다', () => {
    expect(safeEmbedUrl('https://www.youtube.com/embed/abc')).toBe(
      'https://www.youtube.com/embed/abc',
    )
    expect(safeEmbedUrl('https://www.youtube-nocookie.com/embed/abc')).toBe(
      'https://www.youtube-nocookie.com/embed/abc',
    )
  })

  it.each([
    'https://www.youtube.com/watch?v=abc',
    'https://youtube.com/embed/abc',
    'https://www.google.com/search?q=maps',
    'https://evil.example.com/maps',
    'https://evil.example.com/embed/abc',
    'http://www.google.com/maps',
    '/maps/embed',
    '#maps',
    'javascript:alert(1)',
    '',
    undefined,
  ])('%j는 iframe에 넣지 않는다', (value) => {
    expect(safeEmbedUrl(value)).toBeNull()
  })
})

describe('pageLinkKey', () => {
  it('같은 행사 안의 페이지는 event를 비운다', () => {
    expect(pageLinkKey(undefined, 'faq')).toBe(':faq')
  })

  it('다른 행사의 페이지와 행사 자체를 구분한다', () => {
    expect(pageLinkKey('dsf26', 'faq')).toBe('dsf26:faq')
    expect(pageLinkKey('dsf26', undefined)).toBe('dsf26:')
  })

  it('둘 다 없으면 콜론만 남는다', () => {
    expect(pageLinkKey(undefined, undefined)).toBe(':')
  })
})

describe('collectPageRefs', () => {
  it('한 줄짜리 ::page 지시어를 순서대로 모은다', () => {
    const markdown = [
      '# 안내',
      '',
      '::page{path="faq"}',
      '',
      '::page{event="dsf26" path="notice/team"}',
      '',
      '::page{event="dsf25"}',
    ].join('\n')
    expect(collectPageRefs(markdown)).toEqual([
      { event: undefined, path: 'faq' },
      { event: 'dsf26', path: 'notice/team' },
      { event: 'dsf25', path: undefined },
    ])
  })

  it('작은따옴표, 따옴표 없는 값, 앞뒤 공백과 라벨을 받아들인다', () => {
    const markdown = [
      "::page{path='faq'}",
      '  ::page{event=dsf26 path=rules}  ',
      '::page[무시되는 라벨]{path="schedule"}',
    ].join('\n')
    expect(collectPageRefs(markdown)).toEqual([
      { event: undefined, path: 'faq' },
      { event: 'dsf26', path: 'rules' },
      { event: undefined, path: 'schedule' },
    ])
  })

  it('event와 path가 모두 없는 지시어는 뺀다', () => {
    expect(collectPageRefs('::page{title="x"}\n\n::page{}')).toEqual([])
  })

  it('문장 가운데 있거나 다른 지시어인 것은 모으지 않는다', () => {
    expect(
      collectPageRefs(
        '앞 ::page{path="faq"} 뒤\n\n::pages{path="x"}\n\n::image{src="/a.png"}\n\n::page',
      ),
    ).toEqual([])
  })

  it('목록·인용·토글·단 안에 있는 지시어도 렌더러처럼 모은다', () => {
    const markdown = [
      '- ::page{path="list"}',
      '',
      '1. 항목',
      '',
      '   ::page{path="ordered"}',
      '',
      '> ::page{path="quote"}',
      '',
      ':::toggle[열기]',
      '::page{event="dsf26" path="toggle"}',
      ':::',
      '',
      '::::columns',
      ':::column',
      '::page{path="column"}',
      ':::',
      '::::',
    ].join('\n')
    expect(collectPageRefs(markdown)).toEqual([
      { event: undefined, path: 'list' },
      { event: undefined, path: 'ordered' },
      { event: undefined, path: 'quote' },
      { event: 'dsf26', path: 'toggle' },
      { event: undefined, path: 'column' },
    ])
  })

  it('코드 블록 안의 지시어는 렌더러처럼 글자로 보고 모으지 않는다', () => {
    expect(
      collectPageRefs(
        '```\n::page{path="fenced"}\n```\n\n    ::page{path="indented"}',
      ),
    ).toEqual([])
  })

  it('지시어가 없으면 빈 목록', () => {
    expect(collectPageRefs('')).toEqual([])
    expect(collectPageRefs('그냥 글')).toEqual([])
  })
})

describe('NotionMarkdown 렌더링 (remarkNotion, rehypeNotionBreaks, rehypeNotionToc)', () => {
  it('평범한 마크다운은 .notion-content 안에 그린다', () => {
    expect(html('본문')).toBe('<div class="notion-content"><p>본문</p></div>')
  })

  describe('callout', () => {
    it('아이콘과 배경색을 그린다', () => {
      const callout = dom(
        ':::callout{icon="💡" color="blue_background"}\n본문\n:::',
      ).querySelector('.notion-callout')!
      expect(callout.className).toBe('notion-callout notion-blue_background')
      expect(callout.querySelector('.notion-callout-icon')?.textContent).toBe(
        '💡',
      )
      expect(callout.querySelector('.notion-callout-text')?.innerHTML).toBe(
        '<p>본문</p>',
      )
    })

    it('색이 없거나 모르는 색이면 회색 배경, 아이콘이 없으면 아이콘을 그리지 않는다', () => {
      for (const markdown of [
        ':::callout\n본문\n:::',
        ':::callout{color="neon"}\n본문\n:::',
      ]) {
        const callout = dom(markdown).querySelector('.notion-callout')!
        expect(callout.className).toBe('notion-callout notion-gray_background')
        expect(callout.querySelector('.notion-callout-icon')).toBeNull()
        expect(callout.textContent).toBe('본문')
      }
    })

    it('이미지 아이콘을 쓰고, 라벨은 본문에 넣지 않는다', () => {
      const root = dom(
        ':::callout[라벨]{icon="https://example.com/i.png" color="red"}\n본문\n:::',
      )
      const callout = root.querySelector('.notion-callout')!
      expect(callout.className).toBe('notion-callout notion-red')
      expect(
        callout.querySelector('img.notion-callout-icon')?.getAttribute('src'),
      ).toBe('https://example.com/i.png')
      expect(callout.textContent).toBe('본문')
    })
  })

  describe('toggle', () => {
    it('라벨을 summary로 쓰는 details를 만든다', () => {
      expect(body(':::toggle[제목]\n내용\n:::')).toBe(
        '<details class="notion-toggle">' +
          '<summary class="notion-toggle-summary">제목</summary>' +
          '<p>내용</p></details>',
      )
    })

    it('heading 속성이 있으면 제목 크기 클래스를 붙인다', () => {
      expect(body(':::toggle[제목]{heading=2}\n내용\n:::')).toContain(
        '<summary class="notion-toggle-summary notion-h2">제목</summary>',
      )
    })

    it('heading은 1~3으로 자르고, 숫자가 아니면 무시한다', () => {
      expect(body(':::toggle[a]{heading=9}\nx\n:::')).toContain(
        'class="notion-toggle-summary notion-h3"',
      )
      expect(body(':::toggle[a]{heading=0}\nx\n:::')).toContain(
        'class="notion-toggle-summary notion-h1"',
      )
      expect(body(':::toggle[a]{heading="big"}\nx\n:::')).toContain(
        '<summary class="notion-toggle-summary">a</summary>',
      )
    })

    it('라벨이 없으면 빈 summary', () => {
      expect(body(':::toggle\n내용\n:::')).toBe(
        '<details class="notion-toggle">' +
          '<summary class="notion-toggle-summary"></summary>' +
          '<p>내용</p></details>',
      )
    })

    it('summary 안의 강조는 그대로 둔다', () => {
      expect(body(':::toggle[**굵은** 제목]\n내용\n:::')).toContain(
        '<summary class="notion-toggle-summary"><strong>굵은</strong> 제목</summary>',
      )
    })
  })

  describe('columns', () => {
    it('열 묶음과 비율을 flex로 그린다', () => {
      expect(
        body(
          '::::columns\n:::column{ratio=0.5}\n왼쪽\n:::\n:::column\n오른쪽\n:::\n::::',
        ),
      ).toBe(
        '<div class="notion-columns">' +
          '<div class="notion-column" style="flex-grow:0.5;flex-basis:0"><p>왼쪽</p></div>' +
          '<div class="notion-column"><p>오른쪽</p></div></div>',
      )
    })

    it('비율은 0.05~1로 자르고, 숫자가 아니거나 비어 있으면 무시한다', () => {
      const root = dom(
        [
          '::::columns',
          ':::column{ratio=5}',
          'a',
          ':::',
          ':::column{ratio=0}',
          'b',
          ':::',
          ':::column{ratio="wide"}',
          'c',
          ':::',
          ':::column{ratio=""}',
          'd',
          ':::',
          '::::',
        ].join('\n'),
      )
      const styles = [...root.querySelectorAll('.notion-column')].map(
        (column) => column.getAttribute('style'),
      )
      expect(styles).toEqual([
        'flex-grow:1;flex-basis:0',
        'flex-grow:0.05;flex-basis:0',
        null,
        null,
      ])
    })

    it('묶음과 열에 붙은 라벨은 버린다', () => {
      expect(body('::::columns[무시]\n:::column[무시]\n본문\n:::\n::::')).toBe(
        '<div class="notion-columns"><div class="notion-column"><p>본문</p></div></div>',
      )
    })
  })

  describe('color', () => {
    it('블록 색 컨테이너', () => {
      expect(body(':::color{c="gray_background"}\n글\n:::')).toBe(
        '<div class="notion-block-color notion-gray_background"><p>글</p></div>',
      )
    })

    it('블록 색이 없거나 모르는 색이면 기본색', () => {
      expect(body(':::color{c="neon"}\n글\n:::')).toBe(
        '<div class="notion-block-color notion-default"><p>글</p></div>',
      )
      expect(body(':::color\n글\n:::')).toBe(
        '<div class="notion-block-color notion-default"><p>글</p></div>',
      )
    })

    it('글자 색', () => {
      expect(
        body(':color[빨강]{c="red"} :color[노랑 배경]{c="yellow_background"}'),
      ).toBe(
        '<p><span class="notion-red">빨강</span> ' +
          '<span class="notion-yellow_background">노랑 배경</span></p>',
      )
    })

    it('글자 색이 없거나 모르는 색이면 기본색', () => {
      expect(body(':color[a]{c="neon"} :color[b]')).toBe(
        '<p><span class="notion-default">a</span> <span class="notion-default">b</span></p>',
      )
    })
  })

  describe('table', () => {
    const gfm = '| a | b |\n| - | - |\n| 1 | 2 |'

    it('기본은 머리 행 있음, 머리 열 없음', () => {
      expect(body(`:::table\n${gfm}\n:::`)).toBe(
        '<div class="notion-table"><div class="notion-table-scroll"><table>' +
          '<thead><tr><th>a</th><th>b</th></tr></thead>' +
          '<tbody><tr><td>1</td><td>2</td></tr></tbody></table></div></div>',
      )
    })

    it('header-row=false header-column=true', () => {
      expect(
        dom(
          `:::table{header-row=false header-column=true}\n${gfm}\n:::`,
        ).querySelector('.notion-table')?.className,
      ).toBe('notion-table no-header-row header-column')
    })

    it('거짓 값은 false, 0, no 이고 값 없는 속성은 참이다', () => {
      const classes = (attributes: string) =>
        dom(`:::table{${attributes}}\n${gfm}\n:::`).querySelector(
          '.notion-table',
        )?.className
      expect(classes('header-row="0" header-column="no"')).toBe(
        'notion-table no-header-row',
      )
      expect(classes('header-row="no" header-column')).toBe(
        'notion-table no-header-row header-column',
      )
      expect(classes('header-row="true" header-column="false"')).toBe(
        'notion-table',
      )
      expect(classes('header-row header-column="0"')).toBe('notion-table')
    })

    it('라벨은 버린다', () => {
      expect(dom(`:::table[무시]\n${gfm}\n:::`).textContent).not.toContain(
        '무시',
      )
    })
  })

  describe('database', () => {
    it('라벨을 표 위의 제목으로 쓴다', () => {
      expect(body(':::database[참가팀 목록]\n| a |\n| - |\n| 1 |\n:::')).toBe(
        '<div class="notion-database">' +
          '<p class="notion-database-title">참가팀 목록</p>' +
          '<div class="notion-table-scroll"><table><thead><tr><th>a</th></tr></thead>' +
          '<tbody><tr><td>1</td></tr></tbody></table></div></div>',
      )
    })

    it('라벨이 없으면 제목 없이 그린다', () => {
      const root = dom(':::database\n| a |\n| - |\n| 1 |\n:::')
      expect(root.querySelector('.notion-database')).not.toBeNull()
      expect(root.querySelector('.notion-database-title')).toBeNull()
    })
  })

  describe('indent', () => {
    it('들여쓴 블록', () => {
      expect(body(':::indent\n들여쓴 글\n:::')).toBe(
        '<div class="notion-indent"><p>들여쓴 글</p></div>',
      )
    })

    it('빈 컨테이너도 그린다', () => {
      expect(body(':::indent\n:::')).toBe('<div class="notion-indent"></div>')
    })
  })

  describe('gallery', () => {
    it.each([
      ['large', 'notion-gallery notion-gallery-large'],
      ['medium', 'notion-gallery notion-gallery-medium'],
      ['small', 'notion-gallery notion-gallery-small'],
      ['huge', 'notion-gallery notion-gallery-small'],
    ])('size=%s → %s', (size, className) => {
      expect(
        dom(`:::gallery{size="${size}"}\n- 카드\n:::`).querySelector(
          '.notion-gallery',
        )?.className,
      ).toBe(className)
    })

    it('크기가 없으면 small, 라벨은 버린다', () => {
      const root = dom(':::gallery[무시]\n- 카드\n:::')
      expect(root.querySelector('.notion-gallery')?.className).toBe(
        'notion-gallery notion-gallery-small',
      )
      expect(root.textContent).not.toContain('무시')
      expect(root.querySelector('.notion-gallery li')?.textContent).toBe('카드')
    })
  })

  describe('page', () => {
    const pageLinks: NotionPageLinks = {
      ':faq': { href: '/hackathon/dsf26/faq', title: 'FAQ', icon: '❓' },
      'dsf25:faq': {
        href: '/hackathon/dsf25/faq',
        title: '작년 FAQ',
        icon: null,
      },
      'dsf25:': {
        href: '/hackathon/dsf25',
        title: 'DSF 2025',
        icon: 'https://example.com/icon.png',
      },
    }

    it('같은 행사의 하위 페이지를 링크로 바꾼다', () => {
      const link = dom('::page{path="faq"}', pageLinks).querySelector(
        '.notion-page-link a',
      )!
      expect(link.getAttribute('href')).toBe('/hackathon/dsf26/faq')
      expect(link.querySelector('.notion-page-link-icon')?.textContent).toBe(
        '❓',
      )
      expect(link.querySelector('.notion-page-link-title')?.textContent).toBe(
        'FAQ',
      )
    })

    it('다른 행사의 페이지는 아이콘이 없으면 📄을 쓴다', () => {
      const link = dom(
        '::page{event="dsf25" path="faq"}',
        pageLinks,
      ).querySelector('.notion-page-link a')!
      expect(link.getAttribute('href')).toBe('/hackathon/dsf25/faq')
      expect(link.textContent).toBe('📄작년 FAQ')
    })

    it('행사 자체를 가리키고 이미지 아이콘을 쓴다', () => {
      const link = dom('::page{event="dsf25"}', pageLinks).querySelector(
        '.notion-page-link a',
      )!
      expect(link.getAttribute('href')).toBe('/hackathon/dsf25')
      expect(link.querySelector('img')?.getAttribute('src')).toBe(
        'https://example.com/icon.png',
      )
    })

    it('라벨은 무시하고 DB 제목을 쓴다', () => {
      expect(dom('::page[다른 이름]{path="faq"}', pageLinks).textContent).toBe(
        '❓FAQ',
      )
    })

    it('찾지 못한 페이지나 링크 표가 없으면 아무것도 그리지 않는다', () => {
      expect(body('::page{path="missing"}', pageLinks)).toBe('')
      expect(body('::page{path="faq"}')).toBe('')
    })

    it('event도 path도 없으면 원래 글자로 되돌린다', () => {
      expect(body('::page{title="x"}', pageLinks)).toBe(
        '<p>::page{title=&quot;x&quot;}</p>',
      )
    })
  })

  describe('image', () => {
    it('폭과 설명이 있는 그림', () => {
      const figure = dom(
        '::image{src="https://example.com/a.png" alt="그림" width=240 caption="설명"}',
      ).querySelector('figure.notion-image')!
      const img = figure.querySelector('img')!
      expect(img.getAttribute('src')).toBe('https://example.com/a.png')
      expect(img.getAttribute('alt')).toBe('그림')
      expect(img.getAttribute('style')).toBe('width:240px')
      expect(figure.querySelector('figcaption')?.textContent).toBe('설명')
    })

    it('속성이 없으면 빈 alt, 폭 없음, 설명 없음', () => {
      const figure = dom('::image{src="/images/a.png"}').querySelector(
        'figure.notion-image',
      )!
      const img = figure.querySelector('img')!
      expect(img.getAttribute('src')).toBe('/images/a.png')
      expect(img.getAttribute('alt')).toBe('')
      expect(img.hasAttribute('style')).toBe(false)
      expect(figure.querySelector('figcaption')).toBeNull()
    })

    it('폭은 1~10000px로 자르고, 숫자가 아니거나 비면 무시한다', () => {
      const widths = [
        '::image{src="/a.png" width=0}',
        '::image{src="/b.png" width=99999}',
        '::image{src="/c.png" width="abc"}',
        '::image{src="/d.png" width=""}',
        '::image{src="/e.png" width="  "}',
      ].map((markdown) =>
        dom(markdown).querySelector('img')?.getAttribute('style'),
      )
      expect(widths).toEqual(['width:1px', 'width:10000px', null, null, null])
    })

    it('주소가 잘못되면 원문을 드러내지 않고 뺀다', () => {
      expect(body('앞\n\n::image{src="javascript:alert(1)"}\n\n뒤')).toBe(
        '<p>앞</p>\n<p>뒤</p>',
      )
      expect(body('::image{alt="주소 없음"}')).toBe('')
    })
  })

  describe('bookmark', () => {
    it('제목, 설명, 이미지, 파비콘을 갖춘 외부 북마크는 새 창으로 연다', () => {
      const bookmark = dom(
        '::bookmark{url="https://example.com" title="예시" description="설명" ' +
          'image="https://example.com/i.png" icon="https://example.com/f.ico"}',
      ).querySelector('a.notion-bookmark')!
      expect(bookmark.getAttribute('href')).toBe('https://example.com')
      expect(bookmark.getAttribute('target')).toBe('_blank')
      expect(bookmark.getAttribute('rel')).toBe('noopener noreferrer')
      expect(
        bookmark.querySelector('.notion-bookmark-title')?.textContent,
      ).toBe('예시')
      expect(
        bookmark.querySelector('.notion-bookmark-description')?.textContent,
      ).toBe('설명')
      expect(bookmark.querySelector('.notion-bookmark-url')?.textContent).toBe(
        'https://example.com',
      )
      expect(
        bookmark.querySelector('.notion-bookmark-url img')?.getAttribute('src'),
      ).toBe('https://example.com/f.ico')
      expect(
        bookmark
          .querySelector('.notion-bookmark-image img')
          ?.getAttribute('src'),
      ).toBe('https://example.com/i.png')
    })

    it('내부 주소는 같은 창으로 열고 제목이 없으면 주소를 제목으로 쓴다', () => {
      const bookmark = dom('::bookmark{url="/intro/about"}').querySelector(
        'a.notion-bookmark',
      )!
      expect(bookmark.getAttribute('href')).toBe('/intro/about')
      expect(bookmark.hasAttribute('target')).toBe(false)
      expect(
        bookmark.querySelector('.notion-bookmark-title')?.textContent,
      ).toBe('/intro/about')
      expect(bookmark.querySelector('.notion-bookmark-description')).toBeNull()
      expect(bookmark.querySelector('img')).toBeNull()
    })

    it('안전하지 않은 이미지와 아이콘 주소는 버린다', () => {
      const root = dom(
        '::bookmark{url="https://example.com" image="http://example.com/i.png" icon="javascript:x"}',
      )
      expect(root.querySelector('.notion-bookmark')).not.toBeNull()
      expect(root.querySelector('img')).toBeNull()
    })

    it('북마크 주소가 잘못되면 뺀다', () => {
      expect(body('::bookmark{url="javascript:alert(1)"}')).toBe('')
      expect(body('::bookmark{url="//evil.example.com"}')).toBe('')
      expect(body('::bookmark{title="주소 없음"}')).toBe('')
    })

    it('http 사이트로 가는 북마크도 링크로 둔다(옛 회사 홈페이지 등)', () => {
      const bookmark = dom(
        '::bookmark{url="http://example.com"}',
      ).querySelector('a.notion-bookmark')!
      expect(bookmark.getAttribute('href')).toBe('http://example.com')
      expect(bookmark.getAttribute('rel')).toBe('noopener noreferrer')
    })
  })

  describe('video', () => {
    it('폭이 있으면 그 폭으로 그린다', () => {
      const video = dom(
        '::video{src="https://example.com/v.mp4" width=144}',
      ).querySelector('video.notion-video') as HTMLVideoElement
      expect(video.style.width).toBe('144px')
    })

    it('https 또는 내부 동영상', () => {
      const video = dom(
        '::video{src="https://example.com/v.mp4"}',
      ).querySelector('video.notion-video')!
      expect(video.getAttribute('src')).toBe('https://example.com/v.mp4')
      expect(video.hasAttribute('controls')).toBe(true)
      expect(
        dom('::video{src="/v.mp4"}')
          .querySelector('video')
          ?.getAttribute('src'),
      ).toBe('/v.mp4')
    })

    it('주소가 잘못되면 뺀다', () => {
      expect(body('::video{src="ftp://example.com/v.mp4"}')).toBe('')
    })
  })

  describe('embed', () => {
    it('구글 지도를 높이와 제목을 붙여 iframe으로 넣는다', () => {
      const iframe = dom(
        '::embed{src="https://www.google.com/maps/embed?pb=1" height=400 title="오시는 길"}',
      ).querySelector('iframe')!
      expect(iframe.className).toBe('notion-embed')
      expect(iframe.getAttribute('src')).toBe(
        'https://www.google.com/maps/embed?pb=1',
      )
      expect(iframe.getAttribute('height')).toBe('400')
      expect(iframe.getAttribute('title')).toBe('오시는 길')
      expect(iframe.getAttribute('loading')).toBe('lazy')
    })

    it('유튜브는 기본 높이 320과 기본 제목을 쓴다', () => {
      const iframe = dom(
        '::embed{src="https://www.youtube.com/embed/abc"}',
      ).querySelector('iframe')!
      expect(iframe.getAttribute('src')).toBe(
        'https://www.youtube.com/embed/abc',
      )
      expect(iframe.getAttribute('height')).toBe('320')
      expect(iframe.getAttribute('title')).toBe('삽입된 지도 또는 동영상')
    })

    it('높이는 100~2000으로 자른다', () => {
      const heights = [
        '::embed{src="https://maps.google.com/maps?q=x" height=10}',
        '::embed{src="https://www.youtube-nocookie.com/embed/x" height=99999}',
      ].map((markdown) =>
        dom(markdown).querySelector('iframe')?.getAttribute('height'),
      )
      expect(heights).toEqual(['100', '2000'])
    })

    it('허용하지 않은 주소는 iframe 없이 뺀다', () => {
      expect(body('::embed{src="https://evil.example.com/maps"}')).toBe('')
      expect(body('::embed{src="https://www.youtube.com/watch?v=x"}')).toBe('')
      expect(body('::embed{src="/maps"}')).toBe('')
    })
  })

  describe('toc', () => {
    it('제목 1~3에 id를 붙이고 목차를 채운다 (같은 제목은 번호를 붙인다)', () => {
      expect(
        body('::toc\n\n# 하나\n\n## 둘\n\n### 셋\n\n# 하나\n\n# !!!'),
      ).toBe(
        '<nav class="notion-toc" aria-label="목차"><ol>' +
          '<li class="notion-toc-level-1"><a href="#하나" class="notion-link">하나</a></li>' +
          '<li class="notion-toc-level-2"><a href="#둘" class="notion-link">둘</a></li>' +
          '<li class="notion-toc-level-3"><a href="#셋" class="notion-link">셋</a></li>' +
          '<li class="notion-toc-level-1"><a href="#하나-1" class="notion-link">하나</a></li>' +
          '<li class="notion-toc-level-1"><a href="#section" class="notion-link">!!!</a></li>' +
          '</ol></nav>\n' +
          '<h2 id="하나" class="notion-h1">하나</h2>\n' +
          '<h3 id="둘" class="notion-h2">둘</h3>\n' +
          '<h4 id="셋" class="notion-h3">셋</h4>\n' +
          '<h2 id="하나-1" class="notion-h1">하나</h2>\n' +
          '<h2 id="section" class="notion-h1">!!!</h2>',
      )
    })

    it('번호 접미사가 이미 쓰인 제목과도 id가 겹치지 않는다', () => {
      const ids = [
        ...dom('::toc\n\n# a-1\n\n# a\n\n# a').querySelectorAll('h2'),
      ].map((heading) => heading.id)
      expect(ids).toEqual(['a-1', 'a', 'a-2'])
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('제목 4~6은 목차에 넣지 않고 h4로 그린다', () => {
      const root = dom('::toc\n\n#### 넷\n\n##### 다섯\n\n###### 여섯')
      expect(root.querySelectorAll('.notion-toc li')).toHaveLength(0)
      expect(
        [...root.querySelectorAll('h4')].map((heading) => [
          heading.className,
          heading.id,
        ]),
      ).toEqual([
        ['notion-h3', ''],
        ['notion-h3', ''],
        ['notion-h3', ''],
      ])
    })

    it('id와 목차 글자는 강조, 코드, 원시 HTML을 걷어 낸 글자로 만든다', () => {
      const root = dom(
        '::toc\n\n# A <span>B</span> `c`\n\n# 제목 :b[굵게]\n\n# Hello,   World!',
      )
      expect(
        [...root.querySelectorAll('.notion-toc a')].map((link) => [
          link.getAttribute('href'),
          link.textContent,
        ]),
      ).toEqual([
        ['#a-b-c', 'A B c'],
        ['#제목-굵게', '제목 굵게'],
        ['#hello-world', 'Hello,   World!'],
      ])
      expect([...root.querySelectorAll('h2')].map((h) => h.id)).toEqual([
        'a-b-c',
        '제목-굵게',
        'hello-world',
      ])
    })

    it('제목이 없으면 빈 목차, 라벨은 버린다', () => {
      expect(body('::toc[무시]')).toBe(
        '<nav class="notion-toc" aria-label="목차"><ol></ol></nav>',
      )
    })

    it('::toc가 없어도 제목에는 id가 붙는다', () => {
      expect(body('# 일정')).toBe('<h2 id="일정" class="notion-h1">일정</h2>')
    })
  })

  describe('글자 지시어', () => {
    it(':u :b :i :s 는 밑줄, 굵게, 기울임, 취소선', () => {
      expect(body(':u[밑줄] :b[굵게] :i[기울임] :s[취소]')).toBe(
        '<p><u>밑줄</u> <strong>굵게</strong> <em>기울임</em> <del>취소</del></p>',
      )
    })

    it(':b는 한글 문장부호에 붙어도 굵게 만든다', () => {
      expect(body('“:b[강조]”입니다')).toBe(
        '<p>“<strong>강조</strong>”입니다</p>',
      )
    })

    it(':br은 줄바꿈', () => {
      expect(body('줄 :br 바꿈')).toBe('<p>줄 <br/> 바꿈</p>')
      expect(body('가:br[]나')).toBe('<p>가<br/>나</p>')
    })

    it('라벨이 있는 :br은 글자로 되돌린다', () => {
      expect(body('가 :br[x] 나')).toBe('<p>가 :br[x] 나</p>')
    })
  })

  describe('줄바꿈 뒤 원문 줄바꿈 글자 (rehypeNotionBreaks)', () => {
    it('마크다운 강제 줄바꿈 뒤의 \\n을 지운다', () => {
      expect(body('줄  \n다음')).toBe('<p>줄<br/>다음</p>')
      expect(body('줄\\\n다음')).toBe('<p>줄<br/>다음</p>')
      expect(body('- 항목  \n  둘째 줄')).toBe(
        '<ul>\n<li>항목<br/>둘째 줄</li>\n</ul>',
      )
    })

    it(':br 다음 줄로 이어지는 글의 \\n도 지운다', () => {
      expect(body('가:br\n나')).toBe('<p>가<br/>나</p>')
    })

    it('줄바꿈 뒤가 \\n으로 시작하지 않는 글이거나 요소면 그대로 둔다', () => {
      expect(body('줄 :br 바꿈')).toBe('<p>줄 <br/> 바꿈</p>')
      expect(body('가:br[]*기울임*')).toBe('<p>가<br/><em>기울임</em></p>')
      expect(body('끝:br')).toBe('<p>끝<br/></p>')
    })

    it('<br> 없는 단순 줄바꿈은 그대로 둔다', () => {
      expect(body('줄\n다음')).toBe('<p>줄\n다음</p>')
    })
  })

  describe('모르는 지시어', () => {
    it('평범한 글의 콜론은 그대로 둔다', () => {
      expect(body('주최:KAIST 10:30 시작')).toBe('<p>주최:KAIST 10:30 시작</p>')
      expect(body('앞 :foo 뒤')).toBe('<p>앞 :foo 뒤</p>')
    })

    it('글자 지시어는 라벨과 속성까지 원래 글자로 되돌린다', () => {
      expect(body('가 :foo[*라벨*]{a="1" b} 나 :bar 다')).toBe(
        '<p>가 :foo[<em>라벨</em>]{a=&quot;1&quot; b} 나 :bar 다</p>',
      )
    })

    it('한 줄 지시어는 문단으로 되돌린다', () => {
      expect(body('::bar')).toBe('<p>::bar</p>')
      expect(body('::foo[라벨 *강조*]{x="y" flag}')).toBe(
        '<p>::foo[라벨 <em>강조</em>]{x=&quot;y&quot; flag}</p>',
      )
    })

    it('컨테이너는 여는 줄만 문단으로 되돌리고 안쪽 블록은 살린다', () => {
      expect(body(':::baz{k="v"}\n안쪽 글\n:::')).toBe(
        '<p>:::baz{k=&quot;v&quot;}</p>\n<p>안쪽 글</p>',
      )
    })

    it('되돌린 컨테이너 안의 지시어도 계속 처리한다', () => {
      expect(
        body(
          ':::baz[라벨]{k}\n안 :u[밑줄]\n\n::image{src="bad"}\n\n::bar\n:::',
        ),
      ).toBe(
        '<p>:::baz{k}</p>\n<p>라벨</p>\n<p>안 <u>밑줄</u></p>\n<p>::bar</p>',
      )
    })
  })

  describe('링크와 그림', () => {
    it('외부 https 링크는 새 창, 내부·앵커·메일은 같은 창으로 연다', () => {
      const links = [
        ...dom(
          '[a](https://x.example.com) [b](/intro) [c](#h) [d](mailto:a@b.c)',
        ).querySelectorAll('a'),
      ].map((link) => [link.getAttribute('href'), link.getAttribute('target')])
      expect(links).toEqual([
        ['https://x.example.com', '_blank'],
        ['/intro', null],
        ['#h', null],
        ['mailto:a@b.c', null],
      ])
    })

    it('안전하지 않은 링크는 글자만 남긴다', () => {
      const root = dom('[d](javascript:alert(1)) [e](tel:0212345678)')
      expect(root.querySelector('a')).toBeNull()
      expect(root.textContent).toBe('d e')
    })

    it('http 링크는 새 창으로 여는 링크로 둔다', () => {
      const link = dom('[e](http://x.example.com)').querySelector('a')!
      expect(link.getAttribute('href')).toBe('http://x.example.com')
      expect(link.getAttribute('target')).toBe('_blank')
    })

    it('마크다운 그림은 안전한 주소만 그린다', () => {
      const images = [
        ...dom(
          '![대체](https://example.com/a.png) ![x](javascript:x)',
        ).querySelectorAll('img'),
      ].map((img) => [img.getAttribute('src'), img.getAttribute('alt')])
      expect(images).toEqual([['https://example.com/a.png', '대체']])
    })
  })

  describe('그 밖의 블록', () => {
    it('인용, 구분선, 코드 블록에 노션 클래스를 붙인다', () => {
      const root = dom('> 인용\n\n---\n\n```\ncode\n```')
      expect(
        root.querySelector('blockquote.notion-quote')?.textContent,
      ).toContain('인용')
      expect(root.querySelector('.notion-divider')).not.toBeNull()
      expect(root.querySelector('pre.notion-code code')?.textContent).toBe(
        'code\n',
      )
    })

    it('코드 블록 안의 지시어는 글자 그대로 둔다', () => {
      expect(
        dom('```\n::page{path="faq"}\n```').querySelector('pre code')
          ?.textContent,
      ).toBe('::page{path="faq"}\n')
    })
  })
})

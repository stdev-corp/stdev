import type { Element, ElementContent, Root as HastRoot } from 'hast'
import type {
  Image,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
} from 'mdast'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit, SKIP } from 'unist-util-visit'

/*
 * 노션 확장 마크다운.
 *
 * 행사 본문은 GFM 마크다운에 remark-directive 문법을 더해 노션 블록을 표현한다.
 * 지시어는 아래 표의 것만 알아듣고, 그 밖의 `:이름`은 원래 글자로 되돌린다.
 * ("주최:KAIST", "10:30" 같은 평범한 글이 지시어로 읽히기 때문이다.)
 *
 * 블록(컨테이너)  :::callout{icon="💡" color="gray_background"} … :::
 *                :::toggle[제목] … :::
 *                ::::columns  /  :::column{ratio=0.5} … :::  /  ::::
 *                :::color{c="gray_background"} … :::
 *                :::table{header-row=false header-column=true widths="120,373"}
 *                  (안에 GFM 표. widths는 열 폭 px, 주면 표를 본문 폭으로 늘리지 않는다)
 *                :::database[제목] … :::  (데이터베이스 보기를 옮긴 표)
 * 한 줄(리프)     ::page{path="faq"}  /  ::page{event="dsf26" path="faq"}
 *                ::image{src="…" alt="…" width=240 caption="…"}
 *                ::bookmark{url="…" title="…" description="…" image="…"}
 *                ::video{src="…" width=144}  /  ::embed{src="…" height=320}  /  ::toc
 *                :::indent … :::  (들여쓴 블록)  /  :::gallery{size="small"} (카드 목록.
 *                  카드 표지 ![이름](주소 "cover:15%")의 제목은 표지에서 보일 세로 위치)
 * 글자(텍스트)    :color[글자]{c="red"}  /  :u[밑줄]  /  :br{} (줄바꿈, 뒤에 글자가 붙어도
 *                이름이 끝나도록 {}를 붙인다)
 *                :b[굵게] / :i[기울임] / :s[취소선]  (** 등이 한글 문장부호와
 *                맞닿아 강조가 풀릴 때 쓰는 대체 문법)
 */

export const NOTION_COLORS = [
  'default',
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
] as const

export type NotionColor =
  | (typeof NOTION_COLORS)[number]
  | `${(typeof NOTION_COLORS)[number]}_background`

export function isNotionColor(value: unknown): value is NotionColor {
  if (typeof value !== 'string') {
    return false
  }
  const base = value.endsWith('_background')
    ? value.slice(0, -'_background'.length)
    : value
  return (NOTION_COLORS as readonly string[]).includes(base)
}

/** 본문에서 쓸 수 있는 주소: https 또는 사이트 내부 경로('/…', '#…'). */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  if (value.startsWith('/')) {
    // '//host'나 '/\\host'는 브라우저가 다른 사이트 주소로 읽는다. 역슬래시와
    // 공백·제어 문자가 없는 사이트 내부 경로만 받는다.
    return /^\/(?![/\\])[^\\\s\u0000-\u001f]*$/.test(value) ? value : null
  }
  if (value.startsWith('#')) {
    return /^#[^\s\\]*$/.test(value) ? value : null
  }
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' ? value : null
  } catch {
    return null
  }
}

/**
 * 링크로 걸 주소. 이미지·동영상과 달리 http 사이트로 가는 링크(옛 회사 홈페이지
 * 등)와 메일 주소도 허용한다. javascript: 같은 다른 스킴은 막는다.
 */
export function safeLinkUrl(value: unknown): string | null {
  const url = safeUrl(value)
  if (url) {
    return url
  }
  if (typeof value !== 'string') {
    return null
  }
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'mailto:'
      ? value
      : null
  } catch {
    return null
  }
}

/** iframe으로 넣어도 되는 주소. 지도와 동영상만 허용한다. */
export function safeEmbedUrl(value: unknown): string | null {
  const url = safeUrl(value)
  if (!url || !url.startsWith('https://')) {
    return null
  }
  const { hostname, pathname } = new URL(url)
  if (
    (hostname === 'www.google.com' || hostname === 'maps.google.com') &&
    pathname.startsWith('/maps')
  ) {
    return url
  }
  if (
    (hostname === 'www.youtube.com' ||
      hostname === 'www.youtube-nocookie.com') &&
    pathname.startsWith('/embed/')
  ) {
    return url
  }
  return null
}

function toNumber(value: unknown, min: number, max: number) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return undefined
  }
  return Math.min(Math.max(number, min), max)
}

function toBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === null) {
    return fallback
  }
  return !(value === 'false' || value === '0' || value === 'no')
}

/** ::page 지시어를 찾는 키. 같은 행사 안이면 event는 비운다. */
export function pageLinkKey(
  event: string | undefined,
  path: string | undefined,
) {
  return `${event ?? ''}:${path ?? ''}`
}

const pageRefParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)

/**
 * 본문의 ::page 지시어가 가리키는 대상을 모은다. 페이지가 이 목록으로 DB에서
 * 제목과 주소를 찾아 렌더러에 넘긴다. 렌더러와 같은 파서로 읽어야 목록·인용·토글
 * 안에 있는 링크도 빠지지 않는다.
 */
export function collectPageRefs(markdown: string) {
  const refs: { event?: string; path?: string }[] = []
  visit(pageRefParser.parse(markdown), 'leafDirective', (node) => {
    if (node.name !== 'page') return
    const event = node.attributes?.event || undefined
    const path = node.attributes?.path || undefined
    if (event || path) {
      refs.push({ event, path })
    }
  })
  return refs
}

type DirectiveNode = Extract<
  RootContent,
  { type: 'containerDirective' | 'leafDirective' | 'textDirective' }
>

type Props = Record<string, string | number | boolean>

function setElement(node: DirectiveNode, name: string, properties: Props = {}) {
  node.data = { ...node.data, hName: name, hProperties: properties }
}

function attr(node: DirectiveNode, key: string) {
  const value = node.attributes?.[key]
  return value === null ? undefined : value
}

/** 알아듣지 못한 지시어를 원래 쓰인 글자로 되돌린다. */
function literal(node: DirectiveNode): PhrasingContent[] {
  const marker =
    node.type === 'textDirective'
      ? ':'
      : node.type === 'leafDirective'
        ? '::'
        : ':::'
  const attributes = Object.entries(node.attributes ?? {})
    .map(([key, value]) => (value ? `${key}="${value}"` : key))
    .join(' ')
  const label: PhrasingContent[] =
    node.type === 'textDirective' || node.type === 'leafDirective'
      ? (node.children as PhrasingContent[])
      : []
  return [
    { type: 'text', value: `${marker}${node.name}` },
    ...(label.length > 0
      ? [
          { type: 'text', value: '[' } as PhrasingContent,
          ...label,
          { type: 'text', value: ']' } as PhrasingContent,
        ]
      : []),
    ...(attributes
      ? [{ type: 'text', value: `{${attributes}}` } as PhrasingContent]
      : []),
  ]
}

function takeLabel(node: DirectiveNode): Paragraph | null {
  if (node.type !== 'containerDirective') {
    return null
  }
  const first = node.children[0]
  if (first?.type === 'paragraph' && first.data?.directiveLabel) {
    node.children.shift()
    return first
  }
  return null
}

function stringAttr(node: DirectiveNode, key: string) {
  const value = attr(node, key)
  return typeof value === 'string' ? value : undefined
}

/**
 * remark 단계: 지시어를 노션 전용 요소 이름으로 바꾼다. 속성은 여기서 검사해
 * 허용된 값만 넘기므로 컴포넌트는 그대로 그려도 된다.
 */
export function remarkNotion() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (
        node.type !== 'containerDirective' &&
        node.type !== 'leafDirective' &&
        node.type !== 'textDirective'
      ) {
        return
      }
      const directive = node as DirectiveNode
      const handled = transform(directive)
      if (handled === true || !parent || index === undefined) {
        return
      }
      if (handled === 'drop') {
        // 아는 블록 지시어인데 주소가 잘못됐다: 원문을 드러내지 않고 뺀다.
        parent.children.splice(index, 1)
        return [SKIP, index]
      }
      // 모르는 지시어: 글자로 되돌린다. 블록 자리였다면 문단으로 감싼다.
      const text = literal(directive)
      if (directive.type === 'textDirective') {
        parent.children.splice(index, 1, ...(text as never[]))
        return [SKIP, index + text.length]
      }
      const replacement: RootContent[] = [
        { type: 'paragraph', children: text },
        ...(directive.type === 'containerDirective'
          ? (directive.children as RootContent[])
          : []),
      ]
      parent.children.splice(index, 1, ...(replacement as never[]))
      return [SKIP, index + 1]
    })
  }
}

/** true: 바꿈, false: 모르는 지시어(글자로 되돌림), 'drop': 잘못된 블록(뺌) */
function transform(node: DirectiveNode): boolean | 'drop' {
  if (node.type === 'textDirective') {
    switch (node.name) {
      case 'color': {
        const color = stringAttr(node, 'c')
        setElement(node, 'span', {
          className: isNotionColor(color)
            ? `notion-${color}`
            : 'notion-default',
        })
        return true
      }
      case 'u':
        setElement(node, 'u')
        return true
      case 'b':
        setElement(node, 'strong')
        return true
      case 'i':
        setElement(node, 'em')
        return true
      case 's':
        setElement(node, 'del')
        return true
      case 'br':
        if (node.children.length > 0) {
          return false
        }
        setElement(node, 'br')
        return true
      default:
        return false
    }
  }

  if (node.type === 'leafDirective') {
    switch (node.name) {
      case 'page': {
        const path = stringAttr(node, 'path')
        const event = stringAttr(node, 'event')
        if (!path && !event) {
          return false
        }
        setElement(node, 'notion-page-link', {
          linkKey: pageLinkKey(event, path),
        })
        node.children = []
        return true
      }
      case 'image': {
        const src = safeUrl(stringAttr(node, 'src'))
        if (!src) {
          return 'drop'
        }
        const width = toNumber(stringAttr(node, 'width'), 1, 10000)
        setElement(node, 'notion-image', {
          src,
          alt: stringAttr(node, 'alt') ?? '',
          ...(width ? { width } : {}),
          ...(stringAttr(node, 'caption')
            ? { caption: stringAttr(node, 'caption')! }
            : {}),
        })
        node.children = []
        return true
      }
      case 'bookmark': {
        const url = safeLinkUrl(stringAttr(node, 'url'))
        if (!url) {
          return 'drop'
        }
        const image = safeUrl(stringAttr(node, 'image'))
        const icon = safeUrl(stringAttr(node, 'icon'))
        setElement(node, 'notion-bookmark', {
          url,
          title: stringAttr(node, 'title') ?? url,
          description: stringAttr(node, 'description') ?? '',
          ...(image ? { image } : {}),
          ...(icon ? { icon } : {}),
        })
        node.children = []
        return true
      }
      case 'video': {
        const src = safeUrl(stringAttr(node, 'src'))
        if (!src) {
          return 'drop'
        }
        const width = toNumber(stringAttr(node, 'width'), 1, 10000)
        setElement(node, 'notion-video', { src, ...(width ? { width } : {}) })
        node.children = []
        return true
      }
      case 'embed': {
        const src = safeEmbedUrl(stringAttr(node, 'src'))
        if (!src) {
          return 'drop'
        }
        setElement(node, 'notion-embed', {
          src,
          height: toNumber(stringAttr(node, 'height'), 100, 2000) ?? 320,
          title: stringAttr(node, 'title') ?? '삽입된 지도 또는 동영상',
        })
        node.children = []
        return true
      }
      case 'toc':
        setElement(node, 'notion-toc')
        node.children = []
        return true
      default:
        return false
    }
  }

  switch (node.name) {
    case 'callout': {
      const color = stringAttr(node, 'color') ?? 'gray_background'
      takeLabel(node)
      setElement(node, 'notion-callout', {
        icon: stringAttr(node, 'icon') ?? '',
        className: `notion-callout notion-${isNotionColor(color) ? color : 'gray_background'}`,
      })
      return true
    }
    case 'toggle': {
      const label = takeLabel(node)
      const heading = toNumber(stringAttr(node, 'heading'), 1, 3)
      node.children.unshift({
        type: 'paragraph',
        data: {
          hName: 'notion-toggle-summary',
          hProperties: heading ? { heading } : {},
        },
        children: label?.children ?? [],
      })
      setElement(node, 'notion-toggle')
      return true
    }
    case 'columns':
      takeLabel(node)
      setElement(node, 'div', { className: 'notion-columns' })
      return true
    case 'column': {
      takeLabel(node)
      const ratio = toNumber(stringAttr(node, 'ratio'), 0.05, 1)
      setElement(node, 'div', {
        className: 'notion-column',
        ...(ratio ? { style: `flex-grow:${ratio};flex-basis:0` } : {}),
      })
      return true
    }
    case 'color': {
      takeLabel(node)
      const color = stringAttr(node, 'c')
      setElement(node, 'div', {
        className: `notion-block-color notion-${isNotionColor(color) ? color : 'default'}`,
      })
      return true
    }
    case 'table': {
      takeLabel(node)
      const classes = ['notion-table']
      if (!toBoolean(attr(node, 'header-row'), true)) {
        classes.push('no-header-row')
      }
      if (toBoolean(attr(node, 'header-column'), false)) {
        classes.push('header-column')
      }
      const properties: Props = { className: classes.join(' ') }
      const widths = attr(node, 'widths')
      if (widths && TABLE_WIDTHS.test(widths)) {
        properties['data-widths'] = widths
      }
      setElement(node, 'div', properties)
      return true
    }
    case 'indent':
      takeLabel(node)
      setElement(node, 'div', { className: 'notion-indent' })
      return true
    case 'gallery': {
      takeLabel(node)
      const size = stringAttr(node, 'size')
      setElement(node, 'div', {
        className: `notion-gallery notion-gallery-${size === 'large' || size === 'medium' ? size : 'small'}`,
      })
      // 카드 표지 제목 "cover:N%"는 표지에서 보일 세로 위치다(노션 표지 위치).
      visit(node, 'image', (image: Image) => {
        const match = COVER_POSITION.exec(image.title ?? '')
        if (!match) return
        image.title = null
        image.data = {
          ...image.data,
          hProperties: {
            ...image.data?.hProperties,
            'data-cover-position': Math.min(Number(match[1]), 100),
          },
        }
      })
      return true
    }
    case 'database': {
      const label = takeLabel(node)
      if (label) {
        node.children.unshift({
          type: 'paragraph',
          data: {
            hName: 'p',
            hProperties: { className: ['notion-database-title'] },
          },
          children: label.children,
        })
      }
      setElement(node, 'div', { className: 'notion-database' })
      return true
    }
    default:
      return false
  }
}

/** 갤러리 카드 표지 이미지의 제목으로 쓰는 세로 위치: "cover:15%" */
const COVER_POSITION = /^cover:(\d{1,3})%$/

/** :::table의 widths 값: 1~4자리 숫자를 쉼표로 이은 것(열 50개까지) */
const TABLE_WIDTHS = /^\d{1,4}(?:,\d{1,4}){0,49}$/

function classesOf(node: Element): string[] {
  // setElement는 className을 문자열로 넘기므로 배열·문자열 둘 다 받는다.
  const value: unknown = node.properties?.className
  if (Array.isArray(value)) return value.map(String)
  return typeof value === 'string' ? value.split(/\s+/) : []
}

function element(
  tagName: string,
  properties: Element['properties'] = {},
  children: ElementContent[] = [],
): Element {
  return { type: 'element', tagName, properties, children }
}

function childElements(node: Element, tagName: string) {
  return node.children.filter(
    (child): child is Element =>
      child.type === 'element' && child.tagName === tagName,
  )
}

/**
 * rehype 단계: :::table 표를 노션 설정대로 고친다.
 * - header-row=false: GFM은 첫 줄을 늘 머리글(thead/th)로 만든다. 노션에서 머리글이
 *   아닌 표는 첫 줄을 본문 줄(td)로 옮겨, 화면 낭독기가 머리글로 읽지 않게 한다.
 * - header-column=true: 줄마다 첫 칸을 줄 머리글(th scope=row)로 바꾼다.
 * - widths: 열 폭 비율(colgroup)과 노션 폭 합(--notion-table-width)을 준다. 표는 그
 *   합만큼만 넓고(노션처럼 늘이지 않는다), 본문 칸이 더 좁으면 비율대로 줄어든다.
 */
export function rehypeNotionTables() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'div' || !classesOf(node).includes('notion-table')) {
        return
      }
      const table = childElements(node, 'table')[0]
      if (!table) return
      const classes = classesOf(node)

      if (classes.includes('no-header-row')) {
        const thead = childElements(table, 'thead')[0]
        if (thead) {
          let tbody = childElements(table, 'tbody')[0]
          if (!tbody) {
            tbody = element('tbody')
            table.children.push(tbody)
          }
          const rows = childElements(thead, 'tr')
          for (const row of rows) {
            for (const cell of childElements(row, 'th')) {
              cell.tagName = 'td'
            }
          }
          tbody.children.unshift(...rows)
          table.children = table.children.filter((child) => child !== thead)
        }
      }

      if (classes.includes('header-column')) {
        for (const tbody of childElements(table, 'tbody')) {
          for (const row of childElements(tbody, 'tr')) {
            const first = row.children.find(
              (child): child is Element => child.type === 'element',
            )
            if (first) {
              first.tagName = 'th'
              first.properties = { ...first.properties, scope: 'row' }
            }
          }
        }
      }

      const raw = node.properties.dataWidths ?? node.properties['data-widths']
      delete node.properties.dataWidths
      delete node.properties['data-widths']
      if (typeof raw === 'string' && TABLE_WIDTHS.test(raw)) {
        const widths = raw
          .split(',')
          .map((width) => Math.min(Math.max(Number(width), 32), 2000))
        const total = widths.reduce((sum, width) => sum + width, 0)
        table.children.unshift(
          element(
            'colgroup',
            {},
            widths.map((width) =>
              element('col', {
                style: `width:${((width / total) * 100).toFixed(3)}%`,
              }),
            ),
          ),
        )
        // 표 폭은 CSS가 min(노션 폭 합, 본문 폭)으로 정한다. 열은 그 안에서 비율을 지킨다.
        table.properties = {
          ...table.properties,
          style: `--notion-table-width:${total}px`,
        }
        node.properties.className = [...classes, 'has-widths']
      }
    })
  }
}

/**
 * rehype 단계: 줄바꿈(<br>) 바로 뒤에 오는 원문 줄바꿈 글자를 지운다. 노션처럼
 * 문단에 white-space: pre-wrap을 주므로, 남겨 두면 줄이 한 번 더 바뀐다.
 */
export function rehypeNotionBreaks() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      node.children.forEach((child, index) => {
        const next = node.children[index + 1]
        if (
          child.type === 'element' &&
          child.tagName === 'br' &&
          next?.type === 'text' &&
          next.value.startsWith('\n')
        ) {
          next.value = next.value.slice(1)
        }
      })
    })
  }
}

function textOf(node: ElementContent): string {
  if (node.type === 'text') {
    return node.value
  }
  if (node.type === 'element') {
    return node.children.map(textOf).join('')
  }
  return ''
}

/**
 * rehype 단계: 제목에 id를 붙이고 ::toc 자리에 목차를 채운다.
 * (노션 '목차' 블록. 제목 1~3을 순서대로 보여 준다.)
 */
export function rehypeNotionToc() {
  return (tree: HastRoot) => {
    const headings: { id: string; text: string; level: number }[] = []
    const used = new Set<string>()

    visit(tree, 'element', (node: Element) => {
      const match = /^h([1-3])$/.exec(node.tagName)
      // 각주 제목(remark-gfm이 만든 숨은 제목)처럼 이미 id가 있는 제목은 그대로 둔다.
      if (!match || node.properties?.id) {
        return
      }
      const text = node.children.map(textOf).join('').trim()
      const base =
        text
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s-]/gu, '')
          .trim()
          .replace(/\s+/g, '-') || 'section'
      // '# a-1, # a, # a'처럼 접미사가 이미 쓰인 경우에도 겹치지 않을 때까지 늘린다.
      let id = base
      for (let count = 1; used.has(id); count += 1) {
        id = `${base}-${count}`
      }
      used.add(id)
      node.properties = { ...node.properties, id }
      headings.push({ id, text, level: Number(match[1]) })
    })

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'notion-toc') {
        return
      }
      node.tagName = 'nav'
      node.properties = { className: ['notion-toc'], ariaLabel: '목차' }
      node.children = [
        {
          type: 'element',
          tagName: 'ol',
          properties: {},
          children: headings.map((heading) => ({
            type: 'element',
            tagName: 'li',
            properties: { className: [`notion-toc-level-${heading.level}`] },
            children: [
              {
                type: 'element',
                tagName: 'a',
                properties: { href: `#${heading.id}` },
                children: [{ type: 'text', value: heading.text }],
              },
            ],
          })),
        },
      ]
    })
  }
}

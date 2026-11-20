/*
 * 노션 블록 → 노션 확장 마크다운(@/utils/notion-markdown).
 *
 * 이미지·첨부는 'notion-asset:<키>' 자리표시자로 남기고, import.ts가 S3에 올린 뒤
 * 실제 주소로 바꾼다.
 */
import type {
  NotionBlock,
  NotionCollection,
  NotionCollectionView,
  NotionRichText,
  PageSnapshot,
} from './notion-api'

export type AssetKind = 'image' | 'file' | 'video'

export type AssetRef = {
  key: string
  kind: AssetKind
  /** 노션 원본 주소(attachment:…, https://prod-files-secure…, /images/…) */
  source: string
  /** 원본을 내려받을 때 권한 확인에 쓰는 블록 */
  blockId: string
  filename: string
  alt: string
}

export type PageTarget = {
  /** 다른 행사면 슬러그, 같은 행사면 undefined */
  event?: string
  /** 행사 안의 하위 페이지 경로. 행사 첫 페이지면 undefined */
  path?: string
  href: string
  title: string
}

export type ConvertContext = {
  snapshot: PageSnapshot
  currentEvent: string
  /** 노션 페이지 ID → 새 주소. null이면 옮기지 않는 페이지(링크를 뺀다). */
  resolvePage: (notionId: string) => PageTarget | null
  /** 개인정보라 본문에서 빼고 안내로 바꿀 블록 ID */
  redactions: Set<string>
  /** 데이터베이스 행 페이지 ID → 하위 페이지 경로 */
  rowPages: Map<string, PageTarget>
  assets: Map<string, AssetRef>
  warnings: string[]
  pageTitle: string
}

export const ASSET_SCHEME = 'notion-asset:'
const BR = '\u0000BR\u0000'

/* ------------------------------------------------------------------ *
 * 글자
 * ------------------------------------------------------------------ */

const PUNCT = /[\p{P}\p{S}]/u
const SPACE = /\s/u

function isPunct(char: string | undefined) {
  return Boolean(char) && PUNCT.test(char!)
}

function isSpace(char: string | undefined) {
  return !char || SPACE.test(char)
}

/** 마크다운에서 뜻이 있는 글자를 이스케이프한다. */
export function escapeText(text: string, inTable = false) {
  let out = text
    .replace(/\\/g, '\\\\')
    .replace(/([*_`[\]<~])/g, '\\$1')
    // 우리 지시어 이름 앞의 콜론은 글자로 남긴다.
    .replace(/:(?=(?:color|u|b|i|s|br)(?:\b|\[|\{))/g, '\\:')
    .replace(/&(?=#?[a-zA-Z0-9]+;)/g, '&amp;')
  if (inTable) {
    out = out.replace(/\|/g, '\\|')
  }
  return out
}

/** 줄 첫머리에서 블록 문법으로 읽힐 글자를 이스케이프한다. */
function escapeLineStart(line: string) {
  return line
    .replace(/^(\s*)([#>+\-=|])/, '$1\\$2')
    .replace(/^(\s*)(\d+)([.)])(\s|$)/, '$1$2\\$3$4')
    .replace(
      /^(\s*)(:{2,})/,
      (_, space: string, colons: string) =>
        `${space}${colons.replace(/:/g, '\\:')}`,
    )
}

type Annotation = [string, unknown?]

/**
 * 지시어 라벨에 넣을 마크다운. 글자 속 대괄호는 escapeText가 이미 이스케이프했고,
 * 남은 대괄호는 안쪽 지시어·링크 문법이므로 그대로 둔다.
 */
function directiveLabel(markdown: string) {
  return markdown
}

function attrValue(value: string) {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (!clean.includes('"')) return `"${clean}"`
  if (!clean.includes("'")) return `'${clean}'`
  return `"${clean.replace(/"/g, '″')}"`
}

export function attrs(
  values: Record<string, string | number | undefined | null>,
) {
  const parts = Object.entries(values)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .map(([key, value]) =>
      typeof value === 'number'
        ? `${key}=${value}`
        : `${key}=${attrValue(value as string)}`,
    )
  return parts.length > 0 ? `{${parts.join(' ')}}` : ''
}

function formatDateMention(value: {
  start_date?: string
  start_time?: string
  end_date?: string
  end_time?: string
}) {
  const one = (date?: string, time?: string) => {
    if (!date) return ''
    const [y, m, d] = date.split('-').map(Number)
    return `${y}년 ${m}월 ${d}일${time ? ` ${time}` : ''}`
  }
  const start = one(value.start_date, value.start_time)
  const end = one(value.end_date, value.end_time)
  return end ? `${start} → ${end}` : start
}

/**
 * 강조 표시(**, *, ~~)가 CommonMark 규칙상 제대로 열리고 닫히는지 본다.
 * 한글 문장에서 '**개최!**다음'처럼 문장부호 뒤에 글자가 붙으면 강조가 풀리므로
 * 그때는 :b[…] 같은 지시어를 쓴다.
 */
function emphasisSafe(
  inner: string,
  before: string | undefined,
  after: string | undefined,
) {
  const first = inner[0]
  const last = inner[inner.length - 1]
  if (!first || isSpace(first) || isSpace(last)) return false
  if (before === '*' || before === '~' || after === '*' || after === '~')
    return false
  const opens = !isPunct(first) || isSpace(before) || isPunct(before)
  const closes = !isPunct(last) || isSpace(after) || isPunct(after)
  return opens && closes
}

type Segment = { text: string; annotations: Annotation[] }

function segmentsOf(richText: NotionRichText | undefined): Segment[] {
  return (richText ?? []).map(([text, annotations]) => ({
    text: text ?? '',
    annotations: ((annotations as Annotation[]) ?? []).filter(Boolean),
  }))
}

function has(annotations: Annotation[], kind: string) {
  return annotations.find((annotation) => annotation[0] === kind)
}

/**
 * 노션 rich text를 마크다운 인라인으로 바꾼다. 줄바꿈은 BR 표지로 남겨
 * 블록이 들여쓰기에 맞춰 바꾼다.
 */
export function richText(
  value: NotionRichText | undefined,
  ctx: ConvertContext,
  options: { inTable?: boolean; plain?: boolean } = {},
): string {
  const segments = segmentsOf(value)
  let out = ''
  segments.forEach((segment, index) => {
    let text = segment.text
    const annotations = segment.annotations

    // 멘션은 글자 대신 대상을 그린다.
    const page = has(annotations, 'p')
    const date = has(annotations, 'd')
    const linkMention = has(annotations, 'lm')
    const user = has(annotations, 'u')
    const equation = has(annotations, 'e')
    if (user) {
      return
    }
    if (page) {
      const target = ctx.resolvePage(String(page[1]))
      out += target
        ? options.plain
          ? escapeText(target.title, options.inTable)
          : `[${escapeText(target.title, options.inTable)}](${target.href})`
        : ''
      return
    }
    if (date) {
      text = formatDateMention(date[1] as never)
    }
    if (equation) {
      text = String(equation[1])
    }
    if (linkMention) {
      const mention = linkMention[1] as { href?: string; title?: string }
      if (mention?.href && !options.plain) {
        out += `[${escapeText(mention.title ?? mention.href, options.inTable)}](<${mention.href}>)`
        return
      }
      text = mention?.title ?? mention?.href ?? text
    }

    if (options.plain) {
      out += text
      return
    }

    const code = has(annotations, 'c') || equation
    const lead = code ? '' : (/^\s*/.exec(text)?.[0] ?? '')
    const trail = code ? '' : (/\s*$/.exec(text)?.[0] ?? '')
    const core = code
      ? text
      : text.slice(lead.length, text.length - trail.length)
    if (core.length === 0) {
      out += text.replace(/\n/g, options.inTable ? ':br{}' : BR)
      return
    }

    let inner: string
    if (code) {
      const longest = Math.max(
        0,
        ...(core.match(/`+/g) ?? []).map((run) => run.length),
      )
      const fence = '`'.repeat(longest + 1)
      const pad = core.startsWith('`') || core.endsWith('`') ? ' ' : ''
      inner = `${fence}${pad}${core.replace(/\n/g, ' ')}${pad}${fence}`
      if (options.inTable) inner = inner.replace(/\|/g, '\\|')
    } else {
      inner = escapeText(core, options.inTable).replace(
        /\n/g,
        options.inTable ? ':br{}' : BR,
      )
    }

    const before = (out + lead).slice(-1) || undefined
    const nextFirst = segments[index + 1]?.text?.[0]
    const nextFormatted = (segments[index + 1]?.annotations.length ?? 0) > 0
    // 다음 조각이 서식을 가지면 그 앞에 강조 기호가 붙을 수 있으므로 보수적으로 본다.
    const after = trail
      ? ' '
      : nextFirst === undefined
        ? undefined
        : isSpace(nextFirst)
          ? ' '
          : nextFormatted
            ? '*'
            : nextFirst

    if (has(annotations, '_')) inner = `:u[${directiveLabel(inner)}]`
    if (has(annotations, 's')) {
      inner =
        emphasisSafe(core, before, after) && !inner.startsWith(':')
          ? `~~${inner}~~`
          : `:s[${directiveLabel(inner)}]`
    }
    if (has(annotations, 'i')) {
      inner =
        emphasisSafe(core, before, after) && !inner.startsWith(':')
          ? `*${inner}*`
          : `:i[${directiveLabel(inner)}]`
    }
    if (has(annotations, 'b')) {
      inner =
        emphasisSafe(core, before, after) &&
        !inner.startsWith(':') &&
        !inner.startsWith('*')
          ? `**${inner}**`
          : `:b[${directiveLabel(inner)}]`
    }
    const color = has(annotations, 'h')
    if (color && color[1] !== 'default') {
      inner = `:color[${directiveLabel(inner)}]${attrs({ c: String(color[1]) })}`
    }
    const link = has(annotations, 'a')
    if (link) {
      const href = resolveHref(String(link[1]), ctx)
      if (href) {
        inner = `[${inner}](<${href}>)`
      }
    }
    out +=
      lead.replace(/\n/g, options.inTable ? ':br{}' : BR) +
      inner +
      trail.replace(/\n/g, options.inTable ? ':br{}' : BR)
  })
  return out
}

/** 노션 내부 링크(/<id>, notion.so/…<id>)는 새 주소로, 그 밖은 그대로 둔다. */
function resolveHref(href: string, ctx: ConvertContext) {
  const internal =
    /^(?:https?:\/\/(?:www\.)?notion\.so\/[^?#]*?|https?:\/\/sboh\.notion\.site\/[^?#]*?|\/)(?:[^/?#]*-)?([0-9a-f]{32})(?:[?#].*)?$/i.exec(
      href,
    )
  if (internal) {
    const target = ctx.resolvePage(internal[1])
    if (target) return target.href
    // 옮기지 않는 노션 페이지(사설 워크스페이스)는 원래 주소를 남기지 않는다.
    if (href.startsWith('/')) return null
  }
  if (href.startsWith('mailto:') || /^https?:\/\//.test(href)) {
    return href
  }
  return null
}

function plainText(value: NotionRichText | undefined) {
  return (value ?? []).map((segment) => segment[0] ?? '').join('')
}

/* ------------------------------------------------------------------ *
 * 블록
 * ------------------------------------------------------------------ */

function indent(text: string, prefix: string) {
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? prefix + line : line))
    .join('\n')
}

/**
 * BR 표지를 하드 줄바꿈(줄 끝 역슬래시)으로 바꾸고 줄머리를 이스케이프한다.
 * 노션은 줄 앞 공백을 보여 주지만 마크다운은 지우므로 &#32;로 남긴다. 줄바꿈으로
 * 끝나는 글은 노션처럼 빈 줄 하나를 더 둔다(역슬래시만 남으면 글자로 보인다).
 */
function paragraph(text: string) {
  const lines = text.split(BR)
  if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
    lines[lines.length - 1] = '&nbsp;'
  }
  return lines
    .map((line) =>
      escapeLineStart(line).replace(/^ +/, (spaces) =>
        '&#32;'.repeat(spaces.length),
      ),
    )
    .join('\\\n')
}

/** 컨테이너 지시어 울타리: 안쪽 울타리보다 하나 길게. */
function fence(inner: string) {
  const longest = Math.max(
    2,
    ...(inner.match(/^\s*(:{3,})/gm) ?? []).map((match) => match.trim().length),
  )
  return ':'.repeat(longest + 1)
}

function container(
  name: string,
  attributes: string,
  inner: string,
  label?: string,
) {
  const colons = fence(inner)
  return `${colons}${name}${label !== undefined ? `[${directiveLabel(label)}]` : ''}${attributes}\n${inner}\n${colons}`
}

function blockColor(block: NotionBlock) {
  const color = block.format?.block_color as string | undefined
  return color && color !== 'default' ? color : undefined
}

function withColor(block: NotionBlock, markdown: string) {
  const color = blockColor(block)
  return color ? container('color', attrs({ c: color }), markdown) : markdown
}

function isFooter(block: NotionBlock, ctx: ConvertContext): boolean {
  const texts: string[] = []
  const walk = (id: string) => {
    const child = ctx.snapshot.blocks[id]
    if (!child) return
    texts.push(plainText(child.properties?.title))
    child.content?.forEach(walk)
  }
  texts.push(plainText(block.properties?.title))
  block.content?.forEach(walk)
  const all = texts.join(' ')
  return /사업자등록번호|고유번호|기획팀장/.test(all)
}

function iconValue(
  icon: unknown,
  blockId: string,
  ctx: ConvertContext,
): string | undefined {
  if (typeof icon !== 'string' || icon.length === 0) return undefined
  if (icon.startsWith('notion://custom_emoji/')) {
    const id = icon.split('/').pop()!
    const emoji = ctx.snapshot.customEmojis[id]
    return emoji
      ? assetPlaceholder(
          ctx,
          'image',
          emoji.url,
          blockId,
          `${emoji.name}.png`,
          '',
        )
      : undefined
  }
  if (/^(https?:|attachment:|\/images\/)/.test(icon)) {
    return assetPlaceholder(ctx, 'image', icon, blockId, filenameOf(icon), '')
  }
  return icon
}

export function filenameOf(source: string) {
  const raw = source.startsWith('attachment:')
    ? source.split(':').slice(2).join(':')
    : decodeURIComponent(source.split('?')[0].split('/').pop() ?? 'file')
  return raw.normalize('NFC') || 'file'
}

/** 노션이 보관하는 파일인지. 이것만 S3로 옮기고 외부 주소는 그대로 쓴다. */
export function isNotionHosted(source: string) {
  return (
    /^(attachment:|\/images\/)/.test(source) ||
    /^https:\/\/(prod-files-secure\.s3[.-]|s3[.-]us-west-2\.amazonaws\.com\/(secure|public)\.notion-static\.com\/|www\.notion\.so\/images\/|file\.notion\.so\/)/.test(
      source,
    )
  )
}

/**
 * 같은 원본인지 가리는 값. 노션 파일 주소의 쿼리는 서명이라 떼지만, 외부 주소는
 * 쿼리가 곧 이미지(예: search.pstatic.net/common/?src=…)라 그대로 둔다.
 */
export function assetIdentity(source: string) {
  return isNotionHosted(source) ? source.split('?')[0] : source
}

/** 본문 이미지 주소: 노션 파일은 자산 자리표시자로, 외부 https 주소는 그대로. */
function imageSource(
  ctx: ConvertContext,
  source: string,
  blockId: string,
  alt: string,
): string | null {
  if (isNotionHosted(source)) {
    return assetPlaceholder(
      ctx,
      'image',
      source,
      blockId,
      filenameOf(source),
      alt,
    )
  }
  if (/^https:\/\//.test(source)) return source
  ctx.warnings.push(`https가 아닌 외부 이미지 건너뜀: ${source}`)
  return null
}

/** 같은 원본은 한 번만 올리도록 원본 주소로 키를 만든다. */
export function assetPlaceholder(
  ctx: ConvertContext,
  kind: AssetKind,
  source: string,
  blockId: string,
  filename: string,
  alt: string,
) {
  const identity = assetIdentity(source)
  let key = [...ctx.assets.values()].find(
    (asset) => assetIdentity(asset.source) === identity,
  )?.key
  if (!key) {
    key = `a${(ctx.assets.size + 1).toString().padStart(4, '0')}`
    ctx.assets.set(key, { key, kind, source, blockId, filename, alt })
  } else if (alt && !ctx.assets.get(key)!.alt) {
    ctx.assets.get(key)!.alt = alt
  }
  return `${ASSET_SCHEME}${key}`
}

type Rendered = string | null

function renderChildren(block: NotionBlock, ctx: ConvertContext) {
  // 목록 항목 아래 이미지는 항목 글을 대체 텍스트 후보로 쓴다.
  return renderBlocks(block.content ?? [], ctx, {
    hint: plainText(block.properties?.title).trim(),
  })
}

function listItem(block: NotionBlock, marker: string, ctx: ConvertContext) {
  const pad = ' '.repeat(marker.length)
  const checked =
    block.type === 'to_do'
      ? plainText(block.properties?.checked as NotionRichText) === 'Yes'
        ? '[x] '
        : '[ ] '
      : ''
  let text = paragraph(richText(block.properties?.title, ctx))
  const color = blockColor(block)
  if (color) {
    text = `:color[${directiveLabel(text)}]${attrs({ c: color })}`
  }
  const head = `${marker}${checked}${text.length > 0 ? text : '&nbsp;'}`
  const children = renderChildren(block, ctx)
  const lines = [
    head
      .split('\n')
      .map((line, index) => (index === 0 ? line : pad + line))
      .join('\n'),
  ]
  if (children) {
    lines.push(indent(children, pad))
  }
  return lines.join('\n\n')
}

function imageBlock(
  block: NotionBlock,
  ctx: ConvertContext,
  altHint: string,
): Rendered {
  const source =
    plainText(block.properties?.source) ||
    (block.format?.display_source as string | undefined)
  if (!source || source.startsWith('data:')) {
    ctx.warnings.push(`빈 이미지 블록 건너뜀: ${block.id}`)
    return null
  }
  const caption = plainText(block.properties?.caption).trim()
  const alt = caption || altHint
  const src = imageSource(ctx, source, block.id, alt)
  if (!src) return null
  const pageWidth =
    block.format?.block_page_width || block.format?.block_full_width
  const width = !pageWidth
    ? Math.round(Number(block.format?.block_width) || 0)
    : 0
  return `::image${attrs({ src, alt, width: width > 0 ? width : undefined, caption })}`
}

function tableBlock(block: NotionBlock, ctx: ConvertContext): Rendered {
  const order = (block.format?.table_block_column_order as string[]) ?? []
  const rows = (block.content ?? [])
    .map((id) => ctx.snapshot.blocks[id])
    .filter((row): row is NotionBlock => Boolean(row))
  if (rows.length === 0 || order.length === 0) return null
  const cell = (row: NotionBlock, column: string) =>
    richText(row.properties?.[column], ctx, { inTable: true }).trim() || ' '
  const lines = rows.map(
    (row) => `| ${order.map((column) => cell(row, column)).join(' | ')} |`,
  )
  lines.splice(1, 0, `| ${order.map(() => '---').join(' | ')} |`)
  const headerRow = block.format?.table_block_column_header === true
  const headerColumn = block.format?.table_block_row_header === true
  const table = lines.join('\n')
  if (headerRow && !headerColumn) return table
  return container(
    'table',
    attrs({
      'header-row': headerRow ? undefined : 'false',
      'header-column': headerColumn ? 'true' : undefined,
    }),
    table,
  )
}

function propertyText(
  value: NotionRichText | undefined,
  type: string,
  ctx: ConvertContext,
): string {
  if (!value) return ''
  switch (type) {
    case 'url': {
      const url = plainText(value)
      return /^https?:\/\//.test(url)
        ? `[${escapeText(url, true)}](<${url}>)`
        : escapeText(url, true)
    }
    case 'checkbox':
      return plainText(value) === 'Yes' ? '✓' : ''
    case 'person':
    case 'created_by':
    case 'last_edited_by':
    case 'relation':
    case 'file':
      return ''
    default:
      return richText(value, ctx, { inTable: true }).trim()
  }
}

function firstImage(
  rowId: string,
  ctx: ConvertContext,
): { source: string; blockId: string } | null {
  const row = ctx.snapshot.blocks[rowId]
  const stack = [...(row?.content ?? [])]
  while (stack.length > 0) {
    const block = ctx.snapshot.blocks[stack.shift()!]
    if (!block) continue
    if (block.type === 'image') {
      const source = plainText(block.properties?.source)
      if (source) return { source, blockId: block.id }
    }
    if (block.type !== 'page') stack.push(...(block.content ?? []))
  }
  return null
}

/** 데이터베이스 보기가 가리키는 컬렉션. 연결된 보기는 보기 쪽 포인터에 있다. */
export function collectionIdOf(
  block: NotionBlock,
  view: NotionCollectionView | undefined,
) {
  return (
    block.collection_id ??
    (view?.format?.collection_pointer as { id?: string } | undefined)?.id
  )
}

/** 갤러리 행 페이지의 속성(이름 제외)을 노션 페이지 머리처럼 표로 그린다. */
export function rowProperties(
  row: NotionBlock,
  collection: NotionCollection,
  ctx: ConvertContext,
) {
  const lines = Object.entries(collection.schema)
    .filter(([key]) => key !== 'title')
    .map(([key, definition]) => {
      const text = propertyText(row.properties?.[key], definition.type, ctx)
      return text ? `| ${escapeText(definition.name, true)} | ${text} |` : null
    })
    .filter((line): line is string => Boolean(line))
  if (lines.length === 0) return null
  return container(
    'table',
    attrs({ 'header-row': 'false', 'header-column': 'true' }),
    [lines[0], '| --- | --- |', ...lines.slice(1)].join('\n'),
  )
}

function collectionBlock(
  block: NotionBlock,
  ctx: ConvertContext,
  asPage = false,
): Rendered {
  if (ctx.redactions.has(block.id)) {
    return redactionNotice()
  }
  const viewId = block.view_ids?.[0]
  const view: NotionCollectionView | undefined = viewId
    ? ctx.snapshot.collectionViews[viewId]
    : undefined
  const collection: NotionCollection | undefined =
    ctx.snapshot.collections[collectionIdOf(block, view) ?? '']
  const rowIds = viewId ? (ctx.snapshot.collectionRows[viewId] ?? []) : []
  if (!collection || !view || rowIds.length === 0) {
    ctx.warnings.push(
      `읽을 수 없는 데이터베이스 보기 건너뜀: ${block.id} (${ctx.pageTitle})`,
    )
    return null
  }
  const schema = collection.schema
  const propertyList = (
    (view.format?.[`${view.type}_properties`] ??
      view.format?.table_properties ??
      []) as { property: string; visible?: boolean }[]
  )
    .filter(
      (property) => property.visible !== false && schema[property.property],
    )
    .map((property) => property.property)
  const visible = [
    'title',
    ...propertyList.filter((property) => property !== 'title'),
  ]
  const rows = rowIds
    .map((id) => ctx.snapshot.blocks[id])
    .filter((row): row is NotionBlock => Boolean(row) && row!.alive !== false)
  const title = plainText(collection.name)
  // 데이터베이스가 곧 페이지면 제목은 페이지 제목이 가진다.
  const hideTitle = asPage || Boolean(view.format?.hide_linked_collection_name)

  const titleCell = (row: NotionBlock, inTable: boolean) => {
    const text =
      richText(row.properties?.title, ctx, { inTable }).trim() || '제목 없음'
    const page = ctx.rowPages.get(row.id)
    if (page) return `[${text}](${page.href})`
    return text
  }

  let body: string
  if (view.type === 'gallery') {
    const cover = (
      view.format?.gallery_cover as { type?: string; property?: string }
    )?.type
    const cards = rows.map((row) => {
      const parts: string[] = []
      let image: { source: string; blockId: string } | null = null
      if (cover === 'page_cover' && row.format?.page_cover) {
        image = { source: String(row.format.page_cover), blockId: row.id }
      } else if (cover === 'page_content') {
        image = firstImage(row.id, ctx)
      }
      const name = plainText(row.properties?.title)
      const src = image
        ? imageSource(ctx, image.source, image.blockId, name)
        : null
      if (src) {
        parts.push(`![${escapeText(name)}](${src})`)
      }
      const urlProperty = Object.entries(schema).find(
        ([, definition]) => definition.type === 'url',
      )?.[0]
      const url = urlProperty ? plainText(row.properties?.[urlProperty]) : ''
      const heading = ctx.rowPages.get(row.id)
        ? titleCell(row, false)
        : /^https?:\/\//.test(url)
          ? `[${escapeText(name)}](<${url}>)`
          : `**${escapeText(name)}**`
      parts.push(heading)
      for (const property of visible.filter(
        (property) => property !== 'title',
      )) {
        const text = propertyText(
          row.properties?.[property],
          schema[property].type,
          ctx,
        )
        if (text) parts.push(text.replace(/:br\{\}/g, ' '))
      }
      return `- ${parts.join('\\\n  ')}`
    })
    const size = (view.format?.gallery_cover_size as string) ?? 'medium'
    body = container('gallery', attrs({ size }), cards.join('\n'))
  } else {
    const dateProperty = Object.entries(schema).find(
      ([, definition]) => definition.type === 'date',
    )?.[0]
    if (view.type === 'calendar' && dateProperty) {
      // 달력 보기는 날짜 칸에 놓이므로 표로 옮길 때 날짜순으로 정렬한다.
      const dateOf = (row: NotionBlock) => {
        const mention = (
          row.properties?.[dateProperty]?.[0]?.[1] as
            [string, { start_date?: string; start_time?: string }][] | undefined
        )?.find((annotation) => annotation[0] === 'd')?.[1]
        return `${mention?.start_date ?? '9999'} ${mention?.start_time ?? ''}`
      }
      rows.sort((a, b) => dateOf(a).localeCompare(dateOf(b)))
    }
    const columns =
      view.type === 'calendar'
        ? [
            'title',
            ...Object.entries(schema)
              .filter(([, d]) => d.type === 'date')
              .map(([key]) => key)
              .slice(0, 1),
          ]
        : visible
    const header = `| ${columns.map((column) => escapeText(schema[column]?.name ?? column, true)).join(' | ')} |`
    const divider = `| ${columns.map(() => '---').join(' | ')} |`
    const lines = rows.map(
      (row) =>
        `| ${columns
          .map((column) =>
            column === 'title'
              ? titleCell(row, true)
              : propertyText(
                  row.properties?.[column],
                  schema[column].type,
                  ctx,
                ) || ' ',
          )
          .join(' | ')} |`,
    )
    body = [header, divider, ...lines].join('\n')
  }
  return container(
    'database',
    '',
    body,
    hideTitle || !title ? undefined : title,
  )
}

function redactionNotice() {
  return container(
    'callout',
    attrs({ icon: '🔒', color: 'gray_background' }),
    '참가자 개인정보 보호를 위해 이 부분의 명단은 삭제했습니다.',
  )
}

function pageLink(targetId: string, ctx: ConvertContext): Rendered {
  const target = ctx.resolvePage(targetId)
  if (!target) return null
  return `::page${attrs({ event: target.event, path: target.path })}`
}

function googleMapsEmbed(block: NotionBlock): string | null {
  const source = String(block.format?.display_source ?? '')
  try {
    const url = new URL(source)
    if (
      url.hostname === 'www.google.com' &&
      url.pathname.startsWith('/maps/embed')
    ) {
      const query = url.searchParams.get('q')
      if (query) {
        // 노션이 붙인 지도 API 키 없이 쓰는 공개 지도 퍼가기 주소로 바꾼다.
        return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
      }
    }
  } catch {
    // 아래에서 북마크로 바꾼다.
  }
  return null
}

function renderBlock(
  id: string,
  ctx: ConvertContext,
  altHint: string,
): Rendered {
  const block = ctx.snapshot.blocks[id]
  if (!block || block.alive === false) return null
  if (ctx.redactions.has(block.id)) return redactionNotice()

  switch (block.type) {
    case 'text': {
      const empty = plainText(block.properties?.title).trim() === ''
      const text = empty
        ? ''
        : paragraph(richText(block.properties?.title, ctx))
      const children = renderChildren(block, ctx)
      const own = withColor(block, text.length > 0 ? text : '&nbsp;')
      return children ? `${own}\n\n${container('indent', '', children)}` : own
    }
    case 'header':
    case 'sub_header':
    case 'sub_sub_header': {
      const level =
        block.type === 'header' ? 1 : block.type === 'sub_header' ? 2 : 3
      const text = richText(block.properties?.title, ctx).split(BR).join(' ')
      if (block.format?.toggleable) {
        return withColor(
          block,
          container(
            'toggle',
            attrs({ heading: level }),
            renderChildren(block, ctx) ?? '',
            text,
          ),
        )
      }
      return withColor(block, `${'#'.repeat(level)} ${text || '&nbsp;'}`)
    }
    case 'toggle': {
      const summary = richText(block.properties?.title, ctx).split(BR).join(' ')
      return withColor(
        block,
        container('toggle', '', renderChildren(block, ctx) ?? '', summary),
      )
    }
    case 'quote': {
      const text = paragraph(richText(block.properties?.title, ctx))
      const children = renderChildren(block, ctx)
      const inner = [text || '&nbsp;', children].filter(Boolean).join('\n\n')
      return withColor(block, indent(inner, '> ').replace(/^$/gm, '>'))
    }
    case 'callout': {
      // 동기화 블록이 아닌 복사본으로 붙인 하단 연락처도 뺀다.
      if (isFooter(block, ctx)) return null
      const text = paragraph(richText(block.properties?.title, ctx))
      const children = renderChildren(block, ctx)
      const inner = [text, children].filter(Boolean).join('\n\n') || '&nbsp;'
      const icon = iconValue(block.format?.page_icon, block.id, ctx)
      return container(
        'callout',
        attrs({ icon, color: blockColor(block) ?? 'default' }),
        inner,
      )
    }
    case 'divider':
      return '---'
    case 'image':
      return imageBlock(block, ctx, altHint)
    case 'video': {
      const source = plainText(block.properties?.source)
      if (!source) return null
      if (/youtube\.com|youtu\.be/.test(source)) {
        const id = /(?:v=|youtu\.be\/|embed\/)([\w-]{11})/.exec(source)?.[1]
        return id
          ? `::embed${attrs({ src: `https://www.youtube.com/embed/${id}`, height: 400 })}`
          : null
      }
      const src = assetPlaceholder(
        ctx,
        'video',
        source,
        block.id,
        filenameOf(source),
        '',
      )
      const pageWidth =
        block.format?.block_page_width || block.format?.block_full_width
      const width = !pageWidth
        ? Math.round(Number(block.format?.block_width) || 0)
        : 0
      return `::video${attrs({ src, width: width > 0 ? width : undefined })}`
    }
    case 'file':
    case 'pdf': {
      // 사용자 결정: 파일은 S3에 보관하되 본문에 내려받기 링크를 두지 않는다.
      const source = plainText(block.properties?.source)
      if (source) {
        assetPlaceholder(
          ctx,
          'file',
          source,
          block.id,
          filenameOf(source),
          plainText(block.properties?.title),
        )
      }
      return null
    }
    case 'bookmark': {
      const url = plainText(block.properties?.link)
      if (!/^https?:\/\//.test(url)) return null
      const image = block.format?.bookmark_cover as string | undefined
      const icon = block.format?.bookmark_icon as string | undefined
      return `::bookmark${attrs({
        url,
        title: plainText(block.properties?.title) || url,
        description: plainText(block.properties?.description).slice(0, 300),
        image: image?.startsWith('https://') ? image : undefined,
        icon: icon?.startsWith('https://') ? icon : undefined,
      })}`
    }
    case 'embed': {
      const map = googleMapsEmbed(block)
      if (map) {
        return `::embed${attrs({ src: map, height: Number(block.format?.block_height) || 400, title: String(block.format?.link_title ?? '지도') })}`
      }
      const source = plainText(block.properties?.source)
      return /^https:\/\//.test(source)
        ? `::bookmark${attrs({ url: source, title: String(block.format?.link_title ?? source) })}`
        : null
    }
    case 'external_object_instance': {
      const uri = String(block.format?.uri ?? '')
      if (!/^https:\/\//.test(uri)) return null
      const attributes = (block.format?.attributes ?? []) as {
        id: string
        values?: string[]
      }[]
      const title =
        attributes.find((attribute) => attribute.id === 'title')?.values?.[0] ??
        uri
      return `::bookmark${attrs({ url: uri, title })}`
    }
    case 'code': {
      const code = plainText(block.properties?.title)
      const language = plainText(block.properties?.language)
        .toLowerCase()
        .replace(/\s+/g, '')
      const longest = Math.max(
        2,
        ...(code.match(/`+/g) ?? []).map((run) => run.length),
      )
      const ticks = '`'.repeat(longest + 1)
      return `${ticks}${language === 'plaintext' ? '' : language}\n${code}\n${ticks}`
    }
    case 'equation':
      return `\`\`\`\n${plainText(block.properties?.title)}\n\`\`\``
    case 'table':
      return tableBlock(block, ctx)
    case 'column_list': {
      const columns = (block.content ?? [])
        .map((columnId) => ctx.snapshot.blocks[columnId])
        .filter((column): column is NotionBlock => Boolean(column))
        .map((column) =>
          container(
            'column',
            attrs({
              ratio: column.format?.column_ratio
                ? Number(column.format.column_ratio)
                : undefined,
            }),
            // 단 대신 블록이 바로 들어 있는 경우(노션 편집 중 생긴 모양)는 그 블록을 그린다.
            (column.type === 'column'
              ? renderChildren(column, ctx)
              : renderBlock(column.id, ctx, ctx.pageTitle)) ?? '&nbsp;',
          ),
        )
      return container('columns', '', columns.join('\n'))
    }
    case 'collection_view':
    case 'collection_view_page':
      if (block.type === 'collection_view_page') {
        return pageLink(block.id, ctx)
      }
      return collectionBlock(block, ctx)
    case 'collection_page_body':
      return collectionBlock({ ...block, type: 'collection_view' }, ctx, true)
    case 'transclusion_container':
      return isFooter(block, ctx) ? null : renderChildren(block, ctx)
    case 'transclusion_reference': {
      const source =
        ctx.snapshot.blocks[
          (block.format?.transclusion_reference_pointer as { id?: string })
            ?.id ?? ''
        ]
      if (!source) {
        ctx.warnings.push(
          `동기화 블록 원본 없음: ${block.id} (${ctx.pageTitle})`,
        )
        return null
      }
      return isFooter(source, ctx) ? null : renderChildren(source, ctx)
    }
    case 'alias':
      return pageLink(
        (block.format?.alias_pointer as { id?: string })?.id ?? '',
        ctx,
      )
    case 'page':
      return pageLink(block.id, ctx)
    case 'table_of_contents':
      return '::toc'
    case 'breadcrumb':
      return null
    default:
      ctx.warnings.push(
        `처리하지 않은 블록 ${block.type}: ${block.id} (${ctx.pageTitle})`,
      )
      return null
  }
}

/** 형제 블록들을 마크다운으로 잇는다. 이어지는 목록 항목은 한 목록으로 묶는다. */
export function renderBlocks(
  ids: string[],
  ctx: ConvertContext,
  options: { hint?: string; trimEdges?: boolean } = {},
): string | null {
  const parts: string[] = []
  let index = 0
  let lastText = options.hint ?? ''
  while (index < ids.length) {
    const block = ctx.snapshot.blocks[ids[index]]
    if (
      block &&
      (block.type === 'bulleted_list' ||
        block.type === 'numbered_list' ||
        block.type === 'to_do')
    ) {
      const type = block.type
      const items: string[] = []
      // 노션은 사이에 다른 블록이 끼어도 번호를 이어 가도록 시작 번호를 둔다.
      const start = Number(block.format?.list_start_index) || 1
      while (
        index < ids.length &&
        ctx.snapshot.blocks[ids[index]]?.type === type
      ) {
        const item = ctx.snapshot.blocks[ids[index]]!
        if (!ctx.redactions.has(item.id)) {
          items.push(
            listItem(
              item,
              type === 'numbered_list' ? `${start + items.length}. ` : '- ',
              ctx,
            ),
          )
        }
        index += 1
      }
      if (items.length > 0) {
        // 항목 안에 블록이 있으면 느슨한 목록, 아니면 촘촘한 목록
        const loose = items.some((item) => item.includes('\n\n'))
        parts.push(items.join(loose ? '\n\n' : '\n'))
      }
      lastText = ''
      continue
    }
    if (
      block?.type === 'text' ||
      block?.type === 'header' ||
      block?.type === 'sub_header' ||
      block?.type === 'sub_sub_header'
    ) {
      lastText = plainText(block.properties?.title).trim() || lastText
    }
    const altHint = lastText || ctx.pageTitle
    const rendered = renderBlock(ids[index], ctx, altHint)
    if (rendered !== null && rendered !== '') {
      parts.push(rendered)
    }
    index += 1
  }
  // 페이지 맨 앞뒤의 빈 줄(노션 여백)만 지운다. 단·토글 안의 빈 줄은 배치를 위한 것이다.
  if (options.trimEdges) {
    while (parts.length > 0 && parts[parts.length - 1] === '&nbsp;') parts.pop()
    while (parts.length > 0 && parts[0] === '&nbsp;') parts.shift()
  }
  return parts.length > 0 ? parts.join('\n\n') : null
}

export function pageTitleText(block: NotionBlock | undefined) {
  return plainText(block?.properties?.title).replace(/\s+/g, ' ').trim()
}

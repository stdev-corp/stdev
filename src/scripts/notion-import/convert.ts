/*
 * .notion-cache/의 노션 페이지를 행사 콘텐츠 묶음(content/)으로 바꾼다.
 *
 *   pnpm exec tsx src/scripts/notion-import/convert.ts
 *
 * content/bundle.json   행사·하위 페이지·기관·자산 목록
 * content/<슬러그>/*.md  본문 마크다운(검토용으로 저장소에 남긴다)
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { BusinessRole } from '@/utils/cms-types'
import { eventHref, eventPageHref } from '@/utils/events'
import {
  DUPLICATE_PAGES,
  EVENTS,
  EXCLUDED_PAGES,
  INSTITUTION_URLS,
  REDACTED_BLOCKS,
  SECTION_INTROS,
  type EventMapping,
  type PageMapping,
} from './mapping'
import type { NotionBlock, PageSnapshot } from './notion-api'
import {
  ASSET_SCHEME,
  assetPlaceholder,
  collectionIdOf,
  filenameOf,
  pageTitleText,
  renderBlocks,
  rowProperties,
  type AssetRef,
  type ConvertContext,
  type PageTarget,
} from './to-markdown'

const ROOT = path.resolve('src/scripts/notion-import')
const CACHE_DIR = path.resolve('.notion-cache')
const OUT_DIR = path.join(ROOT, 'content')

export type BundlePage = {
  path: string
  title: string
  icon: string | null
  cover: string | null
  notionId: string
  file: string
}

export type BundleEvent = {
  slug: string | null
  code: string
  name: string
  category: EventMapping['category']
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  location: string
  roles: Partial<Record<BusinessRole, string[]>>
  icon: string | null
  cover: string | null
  notionId: string | null
  summary: string | null
  file: string | null
  pages: BundlePage[]
}

export type Bundle = {
  institutions: { nameKo: string; url: string | null }[]
  intros: { hackathon: string; conference: string }
  assets: AssetRef[]
  events: BundleEvent[]
}

function normalize(id: string) {
  const hex = id.replace(/-/g, '').toLowerCase()
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function flattenPages(pages: PageMapping[]): PageMapping[] {
  return pages.flatMap((page) => [page, ...flattenPages(page.children ?? [])])
}

async function loadSnapshots() {
  const snapshots = new Map<string, PageSnapshot>()
  for (const file of await readdir(CACHE_DIR)) {
    const snapshot = JSON.parse(
      await readFile(path.join(CACHE_DIR, file), 'utf8'),
    ) as PageSnapshot
    snapshots.set(snapshot.pageId, snapshot)
  }
  return snapshots
}

/** 블록이 들어 있는 스냅숏. 데이터베이스 행 페이지는 부모 페이지의 스냅숏에 있다. */
function snapshotFor(snapshots: Map<string, PageSnapshot>, id: string) {
  const own = snapshots.get(id)
  if (own) return own
  for (const snapshot of snapshots.values()) {
    if (
      snapshot.blocks[id]?.content ||
      (snapshot.collectionViews && snapshot.blocks[id])
    ) {
      return snapshot
    }
  }
  throw new Error(`노션 블록을 찾을 수 없습니다: ${id}`)
}

async function main() {
  const snapshots = await loadSnapshots()
  const assets = new Map<string, AssetRef>()
  const warnings: string[] = []

  // 노션 ID → 새 주소 표
  const targets = new Map<string, PageTarget & { slug: string }>()
  for (const event of EVENTS) {
    if (!event.slug || !event.notionId) continue
    const eventTitle = pageTitleText(
      snapshotFor(snapshots, event.notionId).blocks[event.notionId],
    )
    targets.set(event.notionId, {
      slug: event.slug,
      href: eventHref(event.category, event.slug),
      title: event.name ?? eventTitle,
    })
    for (const page of flattenPages(event.pages)) {
      const block = snapshotFor(snapshots, page.notionId).blocks[page.notionId]
      targets.set(page.notionId, {
        slug: event.slug,
        path: page.path,
        href: eventPageHref(event.category, event.slug, page.path),
        title: page.title ?? pageTitleText(block),
      })
    }
  }

  /**
   * 갤러리 카드가 여는 행 페이지(예: 호텔 주변 활동 가이드의 가게별 페이지). 대응표에
   * 없고 본문이 있으며, 카드가 외부 주소(URL 속성)로 이어지지 않는 행은 갤러리
   * 페이지 아래 번호 경로로 옮긴다. 예) guide/hotel-activities/1
   */
  type RowPage = {
    slug: string
    category: EventMapping['category']
    parentPath: string
    path: string
    rowId: string
    snapshot: PageSnapshot
    collectionId: string
  }
  const rowPages: RowPage[] = []
  for (const event of EVENTS) {
    if (!event.slug || !event.notionId) continue
    const owners = [
      { notionId: event.notionId, path: '' },
      ...flattenPages(event.pages).map((page) => ({
        notionId: page.notionId,
        path: page.path,
      })),
    ]
    for (const owner of owners) {
      const snapshot = snapshots.get(owner.notionId)
      if (!snapshot) continue
      for (const block of Object.values(snapshot.blocks)) {
        if (block.type !== 'collection_view') continue
        const viewId = block.view_ids?.[0]
        const view = viewId ? snapshot.collectionViews[viewId] : undefined
        const collectionId = collectionIdOf(block, view)
        const collection = collectionId
          ? snapshot.collections[collectionId]
          : undefined
        if (view?.type !== 'gallery' || !collection || !collectionId) continue
        const linksOut = Object.values(collection.schema).some(
          (definition) => definition.type === 'url',
        )
        if (linksOut) continue
        let number = 0
        for (const rowId of snapshot.collectionRows[viewId!] ?? []) {
          const row = snapshot.blocks[rowId]
          if (targets.has(rowId) || !row?.content?.length) continue
          number += 1
          const base = owner.path || 'item'
          const path = `${base}/${number}`
          rowPages.push({
            slug: event.slug,
            category: event.category,
            parentPath: owner.path,
            path,
            rowId,
            snapshot,
            collectionId,
          })
          targets.set(rowId, {
            slug: event.slug,
            path,
            href: eventPageHref(event.category, event.slug, path),
            title: pageTitleText(row),
          })
        }
      }
    }
  }

  const resolverFor = (currentSlug: string) => (raw: string) => {
    const id = normalize(raw)
    if (EXCLUDED_PAGES.has(id) || DUPLICATE_PAGES.has(id)) return null
    const target = targets.get(id)
    if (!target) return null
    return {
      ...target,
      // 같은 행사의 하위 페이지는 path만, 행사 첫 페이지는 event로 가리킨다.
      event:
        target.slug === currentSlug && target.path ? undefined : target.slug,
    }
  }

  function context(
    snapshot: PageSnapshot,
    slug: string,
    title: string,
  ): ConvertContext {
    const rowPages = new Map<string, PageTarget>()
    for (const rowIds of Object.values(snapshot.collectionRows)) {
      for (const rowId of rowIds) {
        const target = resolverFor(slug)(rowId)
        if (target) rowPages.set(rowId, target)
      }
    }
    return {
      snapshot,
      currentEvent: slug,
      resolvePage: resolverFor(slug),
      redactions: REDACTED_BLOCKS,
      rowPages,
      assets,
      warnings,
      pageTitle: title,
    }
  }

  function coverOf(block: NotionBlock | undefined, ctx: ConvertContext) {
    const cover = block?.format?.page_cover as string | undefined
    if (!cover) return null
    return assetPlaceholder(
      ctx,
      'image',
      cover,
      block!.id,
      filenameOf(cover),
      '',
    ).slice(ASSET_SCHEME.length)
  }

  function iconOf(block: NotionBlock | undefined, ctx: ConvertContext) {
    const icon = block?.format?.page_icon as string | undefined
    if (!icon) return null
    if (/^(https?:|attachment:|\/images\/|notion:\/\/)/.test(icon)) {
      if (icon.startsWith('notion://custom_emoji/')) {
        const emoji = ctx.snapshot.customEmojis[icon.split('/').pop()!]
        return emoji
          ? assetPlaceholder(
              ctx,
              'image',
              emoji.url,
              block!.id,
              `${emoji.name}.png`,
              '',
            )
          : null
      }
      return assetPlaceholder(
        ctx,
        'image',
        icon,
        block!.id,
        filenameOf(icon),
        '',
      )
    }
    return icon
  }

  /** 페이지 하나의 본문. 데이터베이스 페이지는 그 표 자체가 본문이다. */
  function renderPage(id: string, slug: string, title: string) {
    const snapshot = snapshotFor(snapshots, id)
    const block = snapshot.blocks[id]
    const ctx = context(snapshot, slug, title)
    if (block.type === 'collection_view_page') {
      // 데이터베이스가 곧 페이지: 표를 본문으로, 아이콘은 컬렉션에서 가져온다.
      const databaseCtx = { ...ctx, snapshot: databaseSnapshot(snapshot, id) }
      const view = block.view_ids?.[0]
        ? snapshot.collectionViews[block.view_ids[0]]
        : undefined
      const collection = snapshot.collections[collectionIdOf(block, view) ?? '']
      return {
        content:
          renderBlocks([`__database__${id}`], databaseCtx, {
            trimEdges: true,
          }) ?? '',
        icon: iconOf(
          {
            ...block,
            format: { ...block.format, page_icon: collection?.icon },
          },
          ctx,
        ),
        cover: coverOf(block, ctx),
      }
    }
    return {
      content:
        renderBlocks(block.content ?? [], ctx, { trimEdges: true }) ?? '',
      icon: iconOf(block, ctx),
      cover: coverOf(block, ctx),
    }
  }

  /** collection_view_page를 페이지 본문 데이터베이스로 그리도록 가짜 블록을 끼운다. */
  function databaseSnapshot(snapshot: PageSnapshot, id: string): PageSnapshot {
    const block = snapshot.blocks[id]
    return {
      ...snapshot,
      blocks: {
        ...snapshot.blocks,
        [`__database__${id}`]: {
          ...block,
          id: block.id,
          type: 'collection_page_body',
        },
      },
    }
  }

  /** 갤러리 행 페이지: 노션처럼 속성 표를 먼저, 그다음 행 본문. 표지는 옮기지 않는다. */
  function renderRowPage(rowPage: RowPage, title: string) {
    const ctx = context(rowPage.snapshot, rowPage.slug, title)
    const row = rowPage.snapshot.blocks[rowPage.rowId]
    const collection = rowPage.snapshot.collections[rowPage.collectionId]
    const parts = [
      rowProperties(row, collection, ctx),
      renderBlocks(row.content ?? [], ctx, { trimEdges: true }),
    ].filter(Boolean)
    return { content: parts.join('\n\n'), icon: iconOf(row, ctx), cover: null }
  }

  /**
   * 북마크 미리보기 이미지·아이콘은 외부 사이트 주소를 그대로 쓴다(링크 미리보기라
   * 옮겨 오지 않는다). 이미 사라진 주소는 깨진 그림이 되므로 지금 확인해 뺀다.
   */
  const linkStatus = new Map<string, Promise<boolean>>()
  function alive(url: string) {
    if (!linkStatus.has(url)) {
      linkStatus.set(
        url,
        fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) })
          .then((response) => response.ok)
          .catch(() => false),
      )
    }
    return linkStatus.get(url)!
  }
  /**
   * 본문에 그대로 쓰는 외부 이미지(노션 밖 https 주소)도 사라졌으면 뺀다. 노션
   * 화면에서도 이미 깨져 있던 것들이다.
   */
  async function dropDeadExternalImages(markdown: string) {
    let out = markdown
    for (const match of markdown.matchAll(
      /^[ \t]*::image\{src="(https:\/\/[^"]+)"[^\n]*$/gm,
    )) {
      if (!(await alive(match[1]))) {
        warnings.push(`사라진 외부 이미지 뺌: ${match[1]}`)
        out = out.replace(`${match[0]}\n`, '').replace(match[0], '')
      }
    }
    for (const match of markdown.matchAll(
      /!\[[^\]]*\]\((https:\/\/[^)\s]+)\)(\\\n[ \t]*)?/g,
    )) {
      if (!(await alive(match[1]))) {
        warnings.push(`사라진 외부 이미지 뺌: ${match[1]}`)
        out = out.replace(match[0], '')
      }
    }
    return out
  }

  async function dropDeadBookmarkImages(markdown: string) {
    const lines = (await dropDeadExternalImages(markdown)).split('\n')
    for (const [index, line] of lines.entries()) {
      if (!line.trimStart().startsWith('::bookmark{')) continue
      let next = line
      for (const match of line.matchAll(/ (image|icon)="([^"]+)"/g)) {
        if (!(await alive(match[2]))) {
          warnings.push(`사라진 북마크 ${match[1]} 뺌: ${match[2]}`)
          next = next.replace(match[0], '')
        }
      }
      lines[index] = next
    }
    return lines.join('\n')
  }

  await rm(OUT_DIR, { recursive: true, force: true })
  const bundle: Bundle = {
    institutions: [],
    intros: SECTION_INTROS,
    assets: [],
    events: [],
  }

  for (const event of EVENTS) {
    const dir = event.slug ?? event.code
    await mkdir(path.join(OUT_DIR, dir), { recursive: true })
    let name = event.name ?? ''
    let icon: string | null = null
    let cover: string | null = null
    let file: string | null = null
    if (event.notionId && event.slug) {
      const title = targets.get(event.notionId)!.title
      name = title
      const page = renderPage(event.notionId, event.slug, title)
      icon = page.icon
      cover = page.cover
      file = `${dir}/index.md`
      await writeFile(
        path.join(OUT_DIR, file),
        `${await dropDeadBookmarkImages(page.content)}\n`,
      )
    }

    const pages: BundlePage[] = []
    for (const mapping of flattenPages(event.pages)) {
      const target = targets.get(mapping.notionId)!
      const page = renderPage(mapping.notionId, event.slug!, target.title)
      const pageFile = `${dir}/${mapping.path}.md`
      await mkdir(path.dirname(path.join(OUT_DIR, pageFile)), {
        recursive: true,
      })
      await writeFile(
        path.join(OUT_DIR, pageFile),
        `${await dropDeadBookmarkImages(page.content)}\n`,
      )
      pages.push({
        path: mapping.path,
        title: target.title,
        icon: page.icon,
        cover: page.cover,
        notionId: mapping.notionId,
        file: pageFile,
      })
    }

    for (const rowPage of rowPages.filter(
      (candidate) => candidate.slug === event.slug,
    )) {
      const target = targets.get(rowPage.rowId)!
      const page = renderRowPage(rowPage, target.title)
      const pageFile = `${dir}/${rowPage.path}.md`
      await mkdir(path.dirname(path.join(OUT_DIR, pageFile)), {
        recursive: true,
      })
      await writeFile(
        path.join(OUT_DIR, pageFile),
        `${await dropDeadBookmarkImages(page.content)}\n`,
      )
      pages.push({
        path: rowPage.path,
        title: target.title,
        icon: page.icon,
        cover: null,
        notionId: rowPage.rowId,
        file: pageFile,
      })
    }

    let summary: string | null = null
    if (event.summary) {
      const parts: string[] = []
      if (event.summary.image) {
        const key = `local-${event.summary.image.replace(/\W+/g, '-')}`
        assets.set(key, {
          key,
          kind: 'image',
          source: `local:${event.summary.image}`,
          blockId: '',
          filename: event.summary.image,
          alt: `${name} 행사 사진`,
        })
        parts.push(`![${name} 행사 사진](${ASSET_SCHEME}${key})`)
      }
      parts.push(event.summary.markdown)
      summary = parts.join('\n\n')
    }

    bundle.events.push({
      slug: event.slug,
      code: event.code,
      name,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime ?? null,
      endTime: event.endTime ?? null,
      location: event.location,
      roles: event.roles,
      icon,
      cover,
      notionId: event.notionId,
      summary,
      file,
      pages,
    })
  }

  const names = new Set(
    EVENTS.flatMap((event) => Object.values(event.roles).flat() as string[]),
  )
  bundle.institutions = [...names].sort().map((nameKo) => ({
    nameKo,
    url: INSTITUTION_URLS[nameKo] ?? null,
  }))
  bundle.assets = [...assets.values()]
  await writeFile(
    path.join(OUT_DIR, 'bundle.json'),
    `${JSON.stringify(bundle, null, 2)}\n`,
  )

  console.log(
    `행사 ${bundle.events.length}개, 하위 페이지 ${bundle.events.reduce((sum, event) => sum + event.pages.length, 0)}개, 기관 ${bundle.institutions.length}개, 자산 ${bundle.assets.length}개`,
  )
  for (const warning of warnings) console.warn(`경고: ${warning}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

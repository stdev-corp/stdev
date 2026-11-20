/*
 * 공개(Share to web)된 노션 페이지를 읽는 최소한의 클라이언트.
 * 노션 공식 API가 아니라 notion.site가 쓰는 내부 엔드포인트라, 일회성 이관에만 쓴다.
 */

export const NOTION_SITE = 'https://sboh.notion.site'
export const SPACE_ID = 'c2aa3bf3-0be7-43d8-933c-be4300a79d70'

export type NotionBlock = {
  id: string
  type: string
  properties?: Record<string, NotionRichText>
  format?: Record<string, unknown>
  content?: string[]
  parent_id?: string
  parent_table?: string
  alive?: boolean
  view_ids?: string[]
  collection_id?: string
}

export type NotionRichText = [string, ...unknown[]][]

export type NotionCollection = {
  id: string
  icon?: string
  name?: NotionRichText
  schema: Record<string, { name: string; type: string; options?: unknown[] }>
}

export type NotionCollectionView = {
  id: string
  type: string
  name?: string
  format?: Record<string, unknown>
  page_sort?: string[]
}

type RecordMap = {
  block?: Record<string, { value: unknown }>
  collection?: Record<string, { value: unknown }>
  collection_view?: Record<string, { value: unknown }>
  custom_emoji?: Record<string, { value: unknown }>
}

/** 노션 응답은 { value: { value: … } } 또는 { value: … } 로 감싸여 온다. */
export function unwrap<T>(
  record: { value: unknown } | undefined,
): T | undefined {
  if (!record) {
    return undefined
  }
  const value = record.value as { value?: unknown; role?: string }
  if (value && typeof value === 'object' && 'value' in value && value.value) {
    return value.value as T
  }
  return value as T
}

async function post<T>(
  endpoint: string,
  body: unknown,
  attempt = 0,
): Promise<T> {
  // 요청 사이에 쉬어 Cloudflare 차단을 피한다.
  await new Promise((resolve) => setTimeout(resolve, 250))
  const response = await fetch(`${NOTION_SITE}/api/v3/${endpoint}`, {
    method: 'POST',
    // 기본 Node 요청은 Cloudflare가 막는 엔드포인트가 있어 일반 요청 머리를 붙인다.
    headers: {
      'content-type': 'application/json',
      accept: '*/*',
      'user-agent': 'curl/8.7.1',
    },
    body: JSON.stringify(body),
  })
  if (response.status === 429 || response.status >= 500) {
    if (attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      return post(endpoint, body, attempt + 1)
    }
  }
  if (!response.ok) {
    throw new Error(`${endpoint} ${response.status}: ${await response.text()}`)
  }
  return (await response.json()) as T
}

export type PageSnapshot = {
  pageId: string
  blocks: Record<string, NotionBlock>
  collections: Record<string, NotionCollection>
  collectionViews: Record<string, NotionCollectionView>
  /** 보기 ID → 그 보기에 보이는 행(페이지) ID 순서 */
  collectionRows: Record<string, string[]>
  customEmojis: Record<string, { url: string; name: string }>
}

function mergeRecordMap(snapshot: PageSnapshot, recordMap: RecordMap) {
  for (const [id, record] of Object.entries(recordMap.block ?? {})) {
    const block = unwrap<NotionBlock>(record)
    if (block) snapshot.blocks[id] = block
  }
  for (const [id, record] of Object.entries(recordMap.collection ?? {})) {
    const collection = unwrap<NotionCollection>(record)
    if (collection) snapshot.collections[id] = collection
  }
  for (const [id, record] of Object.entries(recordMap.collection_view ?? {})) {
    const view = unwrap<NotionCollectionView>(record)
    if (view) snapshot.collectionViews[id] = view
  }
  for (const [id, record] of Object.entries(recordMap.custom_emoji ?? {})) {
    const emoji = unwrap<{ url: string; name: string }>(record)
    if (emoji) snapshot.customEmojis[id] = emoji
  }
}

async function loadChunks(snapshot: PageSnapshot, pageId: string) {
  let cursor: { stack: unknown[] } = { stack: [] }
  let chunkNumber = 0
  do {
    const result = await post<{
      recordMap: RecordMap
      cursor: { stack: unknown[] }
    }>('loadPageChunk', {
      pageId,
      limit: 100,
      cursor,
      chunkNumber,
      verticalColumns: false,
    })
    mergeRecordMap(snapshot, result.recordMap)
    cursor = result.cursor
    chunkNumber += 1
  } while (cursor.stack.length > 0)
}

/**
 * 페이지(와 데이터베이스 행 페이지) 아래에서 실제로 쓰이는데 아직 없는 블록.
 * loadPageChunk는 상위 페이지 블록도 함께 돌려주므로, 그 형제 목록까지 세지
 * 않도록 루트에서 아래로만 따라간다. 하위 페이지 안쪽은 따로 읽는다.
 */
function missingBlockIds(snapshot: PageSnapshot, roots: string[]) {
  const missing = new Set<string>()
  const seen = new Set<string>()
  const walk = (id: string) => {
    if (seen.has(id)) return
    seen.add(id)
    const block = snapshot.blocks[id]
    if (!block) {
      missing.add(id)
      return
    }
    if (block.type === 'page' && !roots.includes(id)) return
    for (const child of block.content ?? []) walk(child)
    const pointer = (
      block.format?.transclusion_reference_pointer as { id?: string }
    )?.id
    if (pointer) walk(pointer)
  }
  roots.forEach(walk)
  return [...missing]
}

/**
 * loadPageChunk는 닫힌 토글처럼 펼쳐지지 않은 블록의 자식을 빠뜨린다.
 * (syncRecordValues는 Cloudflare가 막는 일이 잦아 쓰지 않는다.) 빠진 블록의
 * 부모 블록을 기준으로 다시 loadPageChunk를 부르면 자식이 함께 온다.
 * 부모를 모르는 블록(동기화 블록 원본)은 그 블록 자체를 기준으로 부른다.
 */
async function loadMissing(snapshot: PageSnapshot, roots: string[]) {
  const tried = new Set<string>()
  for (let round = 0; round < 8; round += 1) {
    const missing = missingBlockIds(snapshot, roots)
    if (missing.length === 0) return
    const anchors = new Set<string>()
    for (const id of missing) {
      const parent = Object.values(snapshot.blocks).find((block) =>
        block.content?.includes(id),
      )
      anchors.add(parent && parent.type !== 'page' ? parent.id : id)
    }
    const fresh = [...anchors].filter((anchor) => !tried.has(anchor))
    if (fresh.length === 0) return
    for (const anchor of fresh) {
      tried.add(anchor)
      await loadChunks(snapshot, anchor)
    }
  }
}

async function queryCollection(
  snapshot: PageSnapshot,
  collectionId: string,
  viewId: string,
) {
  const result = await post<{
    result: {
      reducerResults: { collection_group_results: { blockIds: string[] } }
    }
    recordMap: RecordMap
  }>('queryCollection?src=initial_load', {
    source: { type: 'collection', id: collectionId, spaceId: SPACE_ID },
    collectionView: { id: viewId, spaceId: SPACE_ID },
    loader: {
      type: 'reducer',
      reducers: { collection_group_results: { type: 'results', limit: 999 } },
      searchQuery: '',
      userTimeZone: 'Asia/Seoul',
    },
  })
  mergeRecordMap(snapshot, result.recordMap)
  snapshot.collectionRows[viewId] =
    result.result.reducerResults.collection_group_results.blockIds
}

/**
 * 페이지 하나를 통째로 읽는다. 본문 블록, 동기화 블록 원본, 데이터베이스 보기와
 * 행, 행 페이지의 본문(갤러리 카드 이미지)까지 담는다.
 */
export async function fetchPage(pageId: string): Promise<PageSnapshot> {
  const snapshot: PageSnapshot = {
    pageId,
    blocks: {},
    collections: {},
    collectionViews: {},
    collectionRows: {},
    customEmojis: {},
  }
  await loadChunks(snapshot, pageId)

  await loadMissing(snapshot, [pageId])

  // 연결된 데이터베이스 보기는 블록이 아니라 보기 쪽 포인터가 컬렉션을 가리킨다.
  const collectionBlocks = Object.values(snapshot.blocks).filter(
    (block) =>
      block.type === 'collection_view' || block.type === 'collection_view_page',
  )
  for (const block of collectionBlocks) {
    for (const viewId of block.view_ids ?? []) {
      const pointer = (
        snapshot.collectionViews[viewId]?.format?.collection_pointer as
          { id?: string } | undefined
      )?.id
      const collectionId = block.collection_id ?? pointer
      if (collectionId) {
        await queryCollection(snapshot, collectionId, viewId)
      }
    }
  }

  // 갤러리 카드에 쓰는 행 페이지 본문(첫 이미지)과 행 페이지의 하위 블록을 읽는다.
  const rowIds = new Set(Object.values(snapshot.collectionRows).flat())
  for (const rowId of rowIds) {
    const row = snapshot.blocks[rowId]
    if (row?.content?.length) {
      await loadChunks(snapshot, rowId)
    }
  }
  await loadMissing(snapshot, [pageId, ...rowIds])

  return snapshot
}

/** 첨부 파일(PDF, 동영상)의 서명된 다운로드 주소를 받는다. */
export async function signedFileUrl(url: string, blockId: string) {
  const result = await post<{ signedUrls: string[] }>('getSignedFileUrls', {
    urls: [
      {
        url,
        permissionRecord: { table: 'block', id: blockId, spaceId: SPACE_ID },
      },
    ],
  })
  return result.signedUrls[0]
}

/** 이미지 원본을 내려받을 주소. 노션 이미지 프록시는 공개 페이지 이미지를 돌려준다. */
export function imageDownloadUrl(
  source: string,
  blockId: string,
  table = 'block',
) {
  if (source.startsWith('/images/')) {
    return `https://www.notion.so${source}`
  }
  if (
    source.startsWith(
      'https://s3-us-west-2.amazonaws.com/public.notion-static.com/',
    )
  ) {
    return source
  }
  if (
    source.startsWith('attachment:') ||
    source.startsWith('https://prod-files-secure.s3') ||
    source.startsWith(
      'https://s3.us-west-2.amazonaws.com/secure.notion-static.com',
    )
  ) {
    return `${NOTION_SITE}/image/${encodeURIComponent(source)}?table=${table}&id=${blockId}&spaceId=${SPACE_ID}&cache=v2`
  }
  return source
}

export { missingBlockIds }

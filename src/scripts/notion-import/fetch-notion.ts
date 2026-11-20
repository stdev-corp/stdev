/*
 * 노션 페이지 트리를 .notion-cache/에 내려받는다.
 *
 *   pnpm exec tsx src/scripts/notion-import/fetch-notion.ts
 *
 * 두 루트('사단법인 STDev', '사단법인 STDev (이전)') 아래 페이지를 모두 따라간다.
 * 결과는 convert.ts가 마크다운 묶음으로 바꾼다.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fetchPage, type NotionBlock } from './notion-api'
import { NOTION_ROOTS } from './mapping'

const CACHE_DIR = path.resolve('.notion-cache')

function childPages(blocks: Record<string, NotionBlock>, pageId: string) {
  const found: string[] = []
  const walk = (id: string) => {
    for (const child of blocks[id]?.content ?? []) {
      const block = blocks[child]
      if (!block) continue
      if (block.type === 'page' && block.alive !== false) {
        found.push(child)
      } else if (block.type !== 'collection_view_page') {
        walk(child)
      }
    }
  }
  walk(pageId)
  return found
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true })
  const queue = [...NOTION_ROOTS]
  const seen = new Set<string>()
  while (queue.length > 0) {
    const pageId = queue.shift()!
    if (seen.has(pageId)) continue
    seen.add(pageId)
    const snapshot = await fetchPage(pageId)
    await writeFile(
      path.join(CACHE_DIR, `${pageId}.json`),
      JSON.stringify(snapshot),
    )
    const title = snapshot.blocks[pageId]?.properties?.title
      ?.map((s) => s[0])
      .join('')
    console.log(
      `${pageId} ${Object.keys(snapshot.blocks).length} blocks  ${title}`,
    )
    queue.push(...childPages(snapshot.blocks, pageId))
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import NotionMarkdown from '@/components/notion/notion-markdown'
import { collectPageRefs, pageLinkKey } from '@/utils/notion-markdown'
import type { NotionPageLinks } from '@/utils/cms-types'
import type { Bundle } from './convert'

const DIR = path.resolve(__dirname, 'content')
const bundle = JSON.parse(
  readFileSync(path.join(DIR, 'bundle.json'), 'utf8'),
) as Bundle

function read(file: string) {
  return readFileSync(path.join(DIR, file), 'utf8').replace(
    /notion-asset:([\w-]+)/g,
    'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/$1.png',
  )
}

const documents = bundle.events.flatMap((event) => [
  ...(event.file ? [{ event, file: event.file }] : []),
  ...event.pages.map((page) => ({ event, file: page.file })),
])

function linksFor(slug: string, content: string): NotionPageLinks {
  const links: NotionPageLinks = {}
  for (const ref of collectPageRefs(content)) {
    const target = bundle.events.find(
      (event) => event.slug === (ref.event ?? slug),
    )
    if (!target) continue
    if (!ref.path) {
      links[pageLinkKey(ref.event, ref.path)] = {
        href: '/',
        title: target.name,
        icon: null,
      }
      continue
    }
    const page = target.pages.find((candidate) => candidate.path === ref.path)
    if (page) {
      links[pageLinkKey(ref.event, ref.path)] = {
        href: '/',
        title: page.title,
        icon: null,
      }
    }
  }
  return links
}

describe('노션에서 옮긴 행사 콘텐츠', () => {
  it.each(documents.map((document) => [document.file, document]))(
    '%s 은(는) 지시어가 모두 해석되고 하위 페이지 링크가 이어진다',
    (_file, { event, file }) => {
      const content = read(file)
      const links = linksFor(event.slug!, content)
      for (const ref of collectPageRefs(content)) {
        expect(
          links[pageLinkKey(ref.event, ref.path)],
          JSON.stringify(ref),
        ).toBeDefined()
      }
      const html = renderToStaticMarkup(
        <NotionMarkdown content={content} pageLinks={links} />,
      )
      const text = html.replace(/<[^>]+>/g, ' ')
      expect(text).not.toMatch(/:{2,}[a-z]/)
      expect(text).not.toMatch(/:(color|b|i|s|u)\[|:br/)
      expect(text).not.toContain('notion-asset:')
    },
  )

  it('요약은 마크다운으로 그려진다', () => {
    for (const event of bundle.events.filter(
      (candidate) => candidate.summary,
    )) {
      expect(event.summary).toContain('notion-asset:')
    }
  })

  it('모든 자산 키가 정의되어 있다', () => {
    const keys = new Set(bundle.assets.map((asset) => asset.key))
    const used = documents
      .map(({ file }) => readFileSync(path.join(DIR, file), 'utf8'))
      .concat(
        bundle.events.map(
          (event) => `${event.summary ?? ''} ${event.cover ?? ''}`,
        ),
      )
      .join('\n')
      .match(/notion-asset:([\w-]+)/g)
    for (const reference of used ?? []) {
      expect(keys.has(reference.slice('notion-asset:'.length))).toBe(true)
    }
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isSafeHttpsUrl } from '@/utils/public-url'
import type { Bundle } from './convert'
import { EVENTS } from './mapping'
import { WEBPAGE_LABELS, WEBPAGES } from './webpages'

const bundle = JSON.parse(
  readFileSync(path.resolve(__dirname, 'content', 'bundle.json'), 'utf8'),
) as Bundle

const DAY = 24 * 60 * 60 * 1000

describe('행사 목록에 올릴 뉴스 기사·참여후기', () => {
  it('주소가 겹치지 않는다', () => {
    const urls = WEBPAGES.map((webpage) => webpage.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('글마다 다른 원문 저장본을 가리킨다', () => {
    const archives = WEBPAGES.map((webpage) => webpage.archive)
    expect(new Set(archives).size).toBe(archives.length)
  })

  it.each(WEBPAGES.map((webpage) => [webpage.url, webpage]))(
    '%s',
    (_url, webpage) => {
      // 공개 목록은 https 주소만 보여 준다(queryEventWebpages).
      expect(isSafeHttpsUrl(webpage.url)).toBe(true)
      expect(Object.keys(WEBPAGE_LABELS)).toContain(webpage.type)

      // 노션 표의 굵게 표시(**) 같은 서식이 남지 않은 한 줄 글자
      for (const text of [webpage.title, webpage.author]) {
        expect(text).toBe(text.trim())
        expect(text).not.toBe('')
        expect(text).not.toMatch(/\*\*|\n|&(?:quot|amp|#\d+);/)
      }

      // 원문 저장본은 묶음에 있는 PDF 파일 자산이다.
      const archive = bundle.assets.find(
        (asset) => asset.key === webpage.archive,
      )
      expect(archive?.kind).toBe('file')
      expect(archive?.filename).toMatch(/\.pdf$/i)

      // 행사가 있고, 게시일이 행사 앞뒤의 그럴듯한 때다(연도 오타 방지).
      const event = EVENTS.find((candidate) => candidate.slug === webpage.event)
      expect(event).toBeDefined()
      expect(webpage.publishedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const published = new Date(webpage.publishedDate).getTime()
      expect(Number.isNaN(published)).toBe(false)
      expect(new Date(published).toISOString().slice(0, 10)).toBe(
        webpage.publishedDate,
      )
      expect(published).toBeGreaterThanOrEqual(
        new Date(event!.startDate).getTime() - 30 * DAY,
      )
      expect(published).toBeLessThanOrEqual(
        new Date(event!.endDate).getTime() + 120 * DAY,
      )
    },
  )
})

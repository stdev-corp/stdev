import { describe, expect, it } from 'vitest'
import { isSafeHttpsUrl } from '@/utils/public-url'
import { EVENTS } from './mapping'
import { WEBPAGE_LABELS, WEBPAGES } from './webpages'

const DAY = 24 * 60 * 60 * 1000

describe('행사 목록에 올릴 뉴스 기사·참여후기', () => {
  it('주소가 겹치지 않는다', () => {
    const urls = WEBPAGES.map((webpage) => webpage.url)
    expect(new Set(urls).size).toBe(urls.length)
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

import { describe, expect, it } from 'vitest'
import { toDateString, toDateTimeString } from '@/utils/datetime'

describe('datetime utils', () => {
  describe('toDateTimeString', () => {
    it('returns N/A for undefined input', () => {
      expect(toDateTimeString(undefined)).toBe('N/A')
    })

    it('returns N/A for null input', () => {
      expect(toDateTimeString(null)).toBe('N/A')
    })

    it('returns N/A when no argument passed', () => {
      expect(toDateTimeString()).toBe('N/A')
    })

    it('formats a UTC date in Asia/Seoul timezone with 9h offset', () => {
      const d = new Date('2026-05-07T00:00:00.000Z')
      expect(toDateTimeString(d)).toBe('2026년 5월 7일 9:00:00')
    })

    it('formats date crossing day boundary properly', () => {
      const d = new Date('2026-05-06T16:00:00.000Z')
      expect(toDateTimeString(d)).toBe('2026년 5월 7일 1:00:00')
    })

    it('formats midnight KST correctly', () => {
      const d = new Date('2026-05-06T15:00:00.000Z')
      expect(toDateTimeString(d)).toBe('2026년 5월 7일 0:00:00')
    })

    it('formats single-digit months and days without zero padding', () => {
      const d = new Date('2026-01-03T00:00:00.000Z')
      expect(toDateTimeString(d)).toBe('2026년 1월 3일 9:00:00')
    })
  })

  describe('toDateString', () => {
    it('returns N/A for undefined input', () => {
      expect(toDateString(undefined)).toBe('N/A')
    })

    it('returns N/A for null input', () => {
      expect(toDateString(null)).toBe('N/A')
    })

    it('returns N/A when no argument passed', () => {
      expect(toDateString()).toBe('N/A')
    })

    it('formats dates in Asia/Seoul timezone', () => {
      const d = new Date('2026-05-07T00:00:00.000Z')
      expect(toDateString(d)).toBe('2026년 5월 7일')
    })

    it('formats date crossing day boundary into next day', () => {
      const d = new Date('2026-05-06T15:30:00.000Z')
      expect(toDateString(d)).toBe('2026년 5월 7일')
    })

    it('formats dates just before KST midnight as previous day', () => {
      const d = new Date('2026-05-06T14:59:59.000Z')
      expect(toDateString(d)).toBe('2026년 5월 6일')
    })

    it('formats end of year correctly', () => {
      const d = new Date('2026-12-31T15:00:00.000Z')
      expect(toDateString(d)).toBe('2027년 1월 1일')
    })
  })
})

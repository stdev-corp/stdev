import { describe, expect, it } from 'vitest'
import { dateValue } from '@/utils/admin-format'

describe('admin-format', () => {
  describe('dateValue', () => {
    it('formats UTC midnight as YYYY-MM-DD in Seoul (adds 9h)', () => {
      const date = new Date('2026-05-07T00:00:00.000Z')
      expect(dateValue(date)).toBe('2026-05-07')
    })

    it('rolls late UTC day into next Seoul day (16:00Z → 01:00+09 next day)', () => {
      const date = new Date('2026-05-06T16:00:00.000Z')
      expect(dateValue(date)).toBe('2026-05-07')
    })

    it('zero-pads single-digit months and days', () => {
      const date = new Date('2026-01-05T00:00:00.000Z')
      expect(dateValue(date)).toBe('2026-01-05')
    })

    it('accepts a Date instance and returns a string', () => {
      const date = new Date('2026-03-01T00:00:00.000Z')
      expect(typeof dateValue(date)).toBe('string')
    })

    it('rolls year boundary when UTC→KST crosses new year (15:00Z Dec31 → 00:00+09 Jan1)', () => {
      const date = new Date('2025-12-31T15:00:00.000Z')
      expect(dateValue(date)).toBe('2026-01-01')
    })

    it('stays on same day when just before KST midnight (14:59:59Z → 23:59:59+09)', () => {
      const date = new Date('2026-01-04T14:59:59.000Z')
      expect(dateValue(date)).toBe('2026-01-04')
    })

    it('returns YYYY-MM-DD formatted string', () => {
      const date = new Date('2026-06-15T00:00:00.000Z')
      expect(dateValue(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('formats end-of-year correctly before year rolls', () => {
      const date = new Date('2026-12-31T00:00:00.000Z')
      expect(dateValue(date)).toBe('2026-12-31')
    })

    it('uses two-digit zero-padded month and day (Feb 03)', () => {
      const date = new Date('2026-02-03T00:00:00.000Z')
      expect(dateValue(date)).toBe('2026-02-03')
    })
  })
})

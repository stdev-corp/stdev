import { describe, expect, it } from 'vitest'
import {
  text,
  optionalText,
  date,
  optionalNumber,
  requiredNumber,
  recordId,
} from '@/utils/admin-form'

describe('admin-form', () => {
  describe('text', () => {
    it('returns trimmed string for present key', () => {
      const fd = new FormData()
      fd.append('name', '  hello  ')
      expect(text(fd, 'name')).toBe('hello')
    })

    it('returns empty string for missing key', () => {
      const fd = new FormData()
      expect(text(fd, 'missing')).toBe('')
    })

    it('returns empty string when value is a File', () => {
      const fd = new FormData()
      const file = new File(['content'], 'test.txt')
      fd.append('upload', file)
      expect(text(fd, 'upload')).toBe('')
    })

    it('returns empty string for empty value', () => {
      const fd = new FormData()
      fd.append('name', '')
      expect(text(fd, 'name')).toBe('')
    })

    it('trims leading and trailing whitespace', () => {
      const fd = new FormData()
      fd.append('field', '\t value \n')
      expect(text(fd, 'field')).toBe('value')
    })
  })

  describe('optionalText', () => {
    it('returns trimmed string for non-empty value', () => {
      const fd = new FormData()
      fd.append('name', '  world  ')
      expect(optionalText(fd, 'name')).toBe('world')
    })

    it('returns null for empty string', () => {
      const fd = new FormData()
      fd.append('name', '')
      expect(optionalText(fd, 'name')).toBeNull()
    })

    it('returns null for whitespace-only value', () => {
      const fd = new FormData()
      fd.append('name', '   ')
      expect(optionalText(fd, 'name')).toBeNull()
    })

    it('returns null for missing key', () => {
      const fd = new FormData()
      expect(optionalText(fd, 'missing')).toBeNull()
    })

    it('returns non-null for single character value', () => {
      const fd = new FormData()
      fd.append('flag', 'y')
      expect(optionalText(fd, 'flag')).toBe('y')
    })
  })

  describe('date', () => {
    it('parses valid YYYY-MM-DD string to a Date instance', () => {
      const fd = new FormData()
      fd.append('dueDate', '2026-05-07')
      const result = date(fd, 'dueDate')
      expect(result).toBeInstanceOf(Date)
      expect(result.getUTCFullYear()).toBe(2026)
    })

    it('throws error with key name when value is empty', () => {
      const fd = new FormData()
      fd.append('dueDate', '')
      expect(() => date(fd, 'dueDate')).toThrow('dueDate is required')
    })

    it('throws error when key is missing from FormData', () => {
      const fd = new FormData()
      expect(() => date(fd, 'dueDate')).toThrow('dueDate is required')
    })

    it('throws error when value is whitespace only', () => {
      const fd = new FormData()
      fd.append('dueDate', '   ')
      expect(() => date(fd, 'dueDate')).toThrow('dueDate is required')
    })

    it('returns Date for a valid ISO date string', () => {
      const fd = new FormData()
      fd.append('startDate', '2026-01-01')
      const result = date(fd, 'startDate')
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('optionalNumber', () => {
    it('parses numeric string to number', () => {
      const fd = new FormData()
      fd.append('count', '123')
      expect(optionalNumber(fd, 'count')).toBe(123)
    })

    it('returns null for empty string', () => {
      const fd = new FormData()
      fd.append('count', '')
      expect(optionalNumber(fd, 'count')).toBeNull()
    })

    it('returns null for missing key', () => {
      const fd = new FormData()
      expect(optionalNumber(fd, 'count')).toBeNull()
    })

    it('returns 0 for string "0" because "0" is a truthy string', () => {
      const fd = new FormData()
      fd.append('count', '0')
      expect(optionalNumber(fd, 'count')).toBe(0)
    })

    it('returns NaN for non-numeric string (current documented behavior)', () => {
      const fd = new FormData()
      fd.append('count', 'abc')
      expect(optionalNumber(fd, 'count')).toBeNaN()
    })

    it('parses decimal string to float', () => {
      const fd = new FormData()
      fd.append('price', '3.14')
      expect(optionalNumber(fd, 'price')).toBeCloseTo(3.14)
    })
  })

  describe('requiredNumber', () => {
    it('returns parsed number for valid numeric string', () => {
      const fd = new FormData()
      fd.append('count', '5')
      expect(requiredNumber(fd, 'count')).toBe(5)
    })

    it('throws when value is empty string', () => {
      const fd = new FormData()
      fd.append('count', '')
      expect(() => requiredNumber(fd, 'count')).toThrow('count is required')
    })

    it('throws when value is "0" because 0 is falsy', () => {
      const fd = new FormData()
      fd.append('count', '0')
      expect(() => requiredNumber(fd, 'count')).toThrow('count is required')
    })

    it('throws when value is non-numeric because NaN is falsy', () => {
      const fd = new FormData()
      fd.append('count', 'abc')
      expect(() => requiredNumber(fd, 'count')).toThrow('count is required')
    })

    it('throws when key is missing', () => {
      const fd = new FormData()
      expect(() => requiredNumber(fd, 'count')).toThrow('count is required')
    })
  })

  describe('recordId', () => {
    it('returns numeric id from form data', () => {
      const fd = new FormData()
      fd.append('id', '42')
      expect(recordId(fd)).toBe(42)
    })

    it('throws when id is missing', () => {
      const fd = new FormData()
      expect(() => recordId(fd)).toThrow('id is required')
    })

    it('throws when id is "0"', () => {
      const fd = new FormData()
      fd.append('id', '0')
      expect(() => recordId(fd)).toThrow('id is required')
    })

    it('throws when id is empty string', () => {
      const fd = new FormData()
      fd.append('id', '')
      expect(() => recordId(fd)).toThrow('id is required')
    })
  })
})

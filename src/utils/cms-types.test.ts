import { describe, expect, it } from 'vitest'
import type {
  MarkdownType,
  ReportType,
  WebpageType,
  InstitutionLogo,
  WebpageWithBusiness,
  ReportWithFile,
  MarkdownDocument,
  HistoryEntry,
} from '@/utils/cms-types'

describe('cms-types', () => {
  describe('MarkdownType', () => {
    it('accepts all three valid MarkdownType literals', () => {
      const values: MarkdownType[] = ['articles', 'privacy', 'terms']
      expect(values).toHaveLength(3)
    })

    it('each MarkdownType value is a string', () => {
      const values: MarkdownType[] = ['articles', 'privacy', 'terms']
      expect(values.every((v) => typeof v === 'string')).toBe(true)
    })
  })

  describe('ReportType', () => {
    it('accepts both valid ReportType literals', () => {
      const values: ReportType[] = ['meeting', 'donation']
      expect(values).toHaveLength(2)
    })
  })

  describe('WebpageType', () => {
    it('accepts all three valid WebpageType literals', () => {
      const values: WebpageType[] = [
        'blog_post',
        'news_article',
        'press_release',
      ]
      expect(values).toHaveLength(3)
    })
  })

  describe('InstitutionLogo', () => {
    it('accepts null for both fields', () => {
      const entry: InstitutionLogo = { imageUrl: null, imageAlt: null }
      expect(entry.imageUrl).toBeNull()
      expect(entry.imageAlt).toBeNull()
    })

    it('accepts string values for both fields', () => {
      const entry: InstitutionLogo = {
        imageUrl: 'https://example.com/logo.png',
        imageAlt: 'Logo',
      }
      expect(entry.imageUrl).toBe('https://example.com/logo.png')
      expect(entry.imageAlt).toBe('Logo')
    })
  })

  describe('WebpageWithBusiness', () => {
    it('accepts a valid WebpageWithBusiness shape', () => {
      const entry: WebpageWithBusiness = {
        id: 1,
        title: 'Article',
        author: 'Author',
        url: 'https://example.com',
        publishedDate: new Date('2026-01-01'),
        business_name: 'Hackathon',
      }
      expect(entry.id).toBe(1)
      expect(entry.title).toBe('Article')
      expect(entry.author).toBe('Author')
      expect(entry.business_name).toBe('Hackathon')
      expect(entry.publishedDate).toBeInstanceOf(Date)
    })
  })

  describe('ReportWithFile', () => {
    it('accepts a valid ReportWithFile shape', () => {
      const entry: ReportWithFile = {
        id: 10,
        title: 'Donation Report',
        publishedDate: new Date('2026-03-01'),
        file_url: 'https://example.com/report.pdf',
      }
      expect(entry.id).toBe(10)
      expect(entry.title).toBe('Donation Report')
      expect(entry.file_url).toBe('https://example.com/report.pdf')
      expect(entry.publishedDate).toBeInstanceOf(Date)
    })
  })

  describe('MarkdownDocument', () => {
    it('accepts a valid MarkdownDocument shape', () => {
      const doc: MarkdownDocument = {
        id: 5,
        type: 'privacy',
        revisionDate: new Date('2026-01-01'),
        effectiveDate: new Date('2026-01-15'),
        content: '# Privacy Policy',
      }
      expect(doc.id).toBe(5)
      expect(doc.type).toBe('privacy')
      expect(doc.content).toBe('# Privacy Policy')
      expect(doc.revisionDate).toBeInstanceOf(Date)
      expect(doc.effectiveDate).toBeInstanceOf(Date)
    })
  })

  describe('HistoryEntry', () => {
    it('accepts null for optional content and image fields', () => {
      const entry: HistoryEntry = {
        id: 1,
        date: new Date('2020-01-01'),
        title: 'Founded',
        content: null,
        imageUrl: null,
        imageAlt: null,
      }
      expect(entry.content).toBeNull()
      expect(entry.imageUrl).toBeNull()
      expect(entry.imageAlt).toBeNull()
    })

    it('accepts string values for all fields', () => {
      const entry: HistoryEntry = {
        id: 2,
        date: new Date('2026-06-01'),
        title: 'Milestone',
        content: 'Details here',
        imageUrl: 'https://example.com/img.png',
        imageAlt: 'Milestone image',
      }
      expect(entry.title).toBe('Milestone')
      expect(entry.content).toBe('Details here')
      expect(entry.imageUrl).toBe('https://example.com/img.png')
      expect(entry.imageAlt).toBe('Milestone image')
      expect(entry.date).toBeInstanceOf(Date)
    })
  })
})

import { describe, expect, it } from 'vitest'
import sitemap from '@/app/(stdev)/sitemap'
import { HOST } from '@/utils/links'
import { IntroMenu, BusinessMenu, NoticesMenu, InfoMenu } from '@/utils/menus'

describe('sitemap()', () => {
  it('returns an array', () => {
    const result = sitemap()
    expect(Array.isArray(result)).toBe(true)
  })

  it('every entry has a url field', () => {
    const result = sitemap()
    for (const entry of result) {
      expect(entry.url).toBeDefined()
      expect(typeof entry.url).toBe('string')
    }
  })

  it('every url starts with HOST', () => {
    const result = sitemap()
    for (const entry of result) {
      expect(entry.url.startsWith(HOST)).toBe(true)
    }
  })

  it('includes the root url', () => {
    const result = sitemap()
    const urls = result.map((e) => e.url)
    expect(urls).toContain(HOST)
  })

  it('includes all IntroMenu hrefs', () => {
    const result = sitemap()
    const urls = result.map((e) => e.url)
    expect(urls).toContain(HOST + IntroMenu.href)
    for (const sub of IntroMenu.subMenus) {
      expect(urls).toContain(HOST + sub.href)
    }
  })

  it('includes all BusinessMenu hrefs', () => {
    const result = sitemap()
    const urls = result.map((e) => e.url)
    expect(urls).toContain(HOST + BusinessMenu.href)
    for (const sub of BusinessMenu.subMenus) {
      expect(urls).toContain(HOST + sub.href)
    }
  })

  it('includes all NoticesMenu hrefs', () => {
    const result = sitemap()
    const urls = result.map((e) => e.url)
    expect(urls).toContain(HOST + NoticesMenu.href)
    for (const sub of NoticesMenu.subMenus) {
      expect(urls).toContain(HOST + sub.href)
    }
  })

  it('includes all InfoMenu hrefs', () => {
    const result = sitemap()
    const urls = result.map((e) => e.url)
    for (const sub of InfoMenu.subMenus) {
      expect(urls).toContain(HOST + sub.href)
    }
  })

  it('every entry has changeFrequency set to monthly', () => {
    const result = sitemap()
    for (const entry of result) {
      expect(entry.changeFrequency).toBe('monthly')
    }
  })

  it('every entry has a lastModified date', () => {
    const result = sitemap()
    for (const entry of result) {
      expect(entry.lastModified).toBeInstanceOf(Date)
    }
  })

  it('root entry has priority 1', () => {
    const result = sitemap()
    const root = result.find((e) => e.url === HOST)
    expect(root?.priority).toBe(1)
  })
})

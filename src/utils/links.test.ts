import { vi, describe, it, expect, afterEach } from 'vitest'
import { HOST, Links } from '@/utils/links'

describe('links', () => {
  describe('HOST', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('defaults to http://localhost:3000 in test env', () => {
      expect(HOST).toBe('http://localhost:3000')
    })

    it('resolves to https://stdev.kr when NODE_ENV is production', async () => {
      vi.resetModules()
      vi.stubEnv('NODE_ENV', 'production')
      const mod = await import('@/utils/links')
      expect(mod.HOST).toBe('https://stdev.kr')
    })
  })

  describe('Links static properties', () => {
    it('root is /', () => {
      expect(Links.root).toBe('/')
    })

    it('introAbout is /intro/about', () => {
      expect(Links.introAbout).toBe('/intro/about')
    })

    it('introChart is /intro/chart', () => {
      expect(Links.introChart).toBe('/intro/chart')
    })

    it('introArticles is /intro/articles', () => {
      expect(Links.introArticles).toBe('/intro/articles')
    })

    it('introDirectors is /intro/directors', () => {
      expect(Links.introDirectors).toBe('/intro/directors')
    })

    it('introHistory is /intro/history', () => {
      expect(Links.introHistory).toBe('/intro/history')
    })

    it('hackathon is /hackathon (the event list page)', () => {
      expect(Links.hackathon).toBe('/hackathon')
    })

    it('hackathonNews is /hackathon/news', () => {
      expect(Links.hackathonNews).toBe('/hackathon/news')
    })

    it('hackathonBlog is /hackathon/blog', () => {
      expect(Links.hackathonBlog).toBe('/hackathon/blog')
    })

    it('conference is /conference (the event list page)', () => {
      expect(Links.conference).toBe('/conference')
    })

    it('conferenceNews is /conference/news', () => {
      expect(Links.conferenceNews).toBe('/conference/news')
    })

    it('conferenceBlog is /conference/blog', () => {
      expect(Links.conferenceBlog).toBe('/conference/blog')
    })

    it('no longer exposes the removed /business links', () => {
      expect(Links).not.toHaveProperty('businessHackathon')
      expect(Links).not.toHaveProperty('businessConference')
      expect(Links).not.toHaveProperty('businessBlog')
      expect(Links).not.toHaveProperty('businessNews')
    })

    it('noticesPress is /notices/press', () => {
      expect(Links.noticesPress).toBe('/notices/press')
    })

    it('noticesDonation is /notices/donation', () => {
      expect(Links.noticesDonation).toBe('/notices/donation')
    })

    it('noticesRecords is /notices/records', () => {
      expect(Links.noticesRecords).toBe('/notices/records')
    })

    it('infoPrivacy is /info/privacy', () => {
      expect(Links.infoPrivacy).toBe('/info/privacy')
    })

    it('infoTerms is /info/terms', () => {
      expect(Links.infoTerms).toBe('/info/terms')
    })

    it('infoSitemap is /info/sitemap', () => {
      expect(Links.infoSitemap).toBe('/info/sitemap')
    })

    it('msit is https://www.msit.go.kr', () => {
      expect(Links.msit).toBe('https://www.msit.go.kr')
    })

    it('nts is https://www.nts.go.kr', () => {
      expect(Links.nts).toBe('https://www.nts.go.kr')
    })

    it('acrc is https://www.acrc.go.kr', () => {
      expect(Links.acrc).toBe('https://www.acrc.go.kr')
    })

    it('no longer links out to the old event.stdev.kr site', () => {
      expect(Links).not.toHaveProperty('event')
      expect(Object.values(Links)).not.toContain('https://event.stdev.kr')
    })

    it('admin is /admin', () => {
      expect(Links.admin).toBe('/admin')
    })

    it('does not expose section index paths, which have no page', () => {
      expect(Links).not.toHaveProperty('intro')
      expect(Links).not.toHaveProperty('business')
      expect(Links).not.toHaveProperty('notices')
    })

    it('all external links use https protocol', () => {
      expect(Links.msit.startsWith('https://')).toBe(true)
      expect(Links.nts.startsWith('https://')).toBe(true)
      expect(Links.acrc.startsWith('https://')).toBe(true)
    })
  })
})

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

    it('intro is /intro', () => {
      expect(Links.intro).toBe('/intro')
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

    it('business is /business', () => {
      expect(Links.business).toBe('/business')
    })

    it('businessHackathon is /business/hackathon', () => {
      expect(Links.businessHackathon).toBe('/business/hackathon')
    })

    it('businessConference is /business/conference', () => {
      expect(Links.businessConference).toBe('/business/conference')
    })

    it('businessBlog is /business/blog', () => {
      expect(Links.businessBlog).toBe('/business/blog')
    })

    it('businessNews is /business/news', () => {
      expect(Links.businessNews).toBe('/business/news')
    })

    it('notices is /notices', () => {
      expect(Links.notices).toBe('/notices')
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

    it('shop is https://shop.stdev.kr', () => {
      expect(Links.shop).toBe('https://shop.stdev.kr')
    })

    it('admin is /admin', () => {
      expect(Links.admin).toBe('/admin')
    })

    it('all external links use https protocol', () => {
      expect(Links.msit.startsWith('https://')).toBe(true)
      expect(Links.nts.startsWith('https://')).toBe(true)
      expect(Links.acrc.startsWith('https://')).toBe(true)
      expect(Links.shop.startsWith('https://')).toBe(true)
    })
  })
})

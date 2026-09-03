import { describe, expect, it } from 'vitest'
import { resolveBreadcrumb } from '@/utils/breadcrumb'
import { Links } from '@/utils/links'
import { BusinessMenu, InfoMenu, IntroMenu, NoticesMenu } from '@/utils/menus'

describe('resolveBreadcrumb', () => {
  describe('root path', () => {
    it('returns a single 홈 crumb', () => {
      expect(resolveBreadcrumb(Links.root)).toEqual([{ label: '홈' }])
    })

    it('does not link the 홈 crumb because it is the current page', () => {
      const [home] = resolveBreadcrumb(Links.root)
      expect(home.href).toBeUndefined()
    })
  })

  describe('section index pages', () => {
    it('resolves /intro to 홈 > 법인소개', () => {
      expect(resolveBreadcrumb(Links.intro)).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개' },
      ])
    })

    it('resolves /business to 홈 > 행사&프로그램', () => {
      expect(resolveBreadcrumb(Links.business)).toEqual([
        { label: '홈', href: Links.root },
        { label: '행사&프로그램' },
      ])
    })

    it('resolves /notices to 홈 > 공지사항', () => {
      expect(resolveBreadcrumb(Links.notices)).toEqual([
        { label: '홈', href: Links.root },
        { label: '공지사항' },
      ])
    })

    it('does not link the section crumb on its own index page', () => {
      const crumbs = resolveBreadcrumb(Links.intro)
      expect(crumbs[crumbs.length - 1].href).toBeUndefined()
    })
  })

  describe('leaf pages', () => {
    it('resolves /intro/history to 홈 > 법인소개 > 연혁', () => {
      expect(resolveBreadcrumb(Links.introHistory)).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개', href: Links.intro },
        { label: '연혁' },
      ])
    })

    it('resolves /intro/chart to 홈 > 법인소개 > 조직도', () => {
      expect(resolveBreadcrumb(Links.introChart)).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개', href: Links.intro },
        { label: '조직도' },
      ])
    })

    it('resolves /business/hackathon to 홈 > 행사&프로그램 > 해커톤', () => {
      expect(resolveBreadcrumb(Links.businessHackathon)).toEqual([
        { label: '홈', href: Links.root },
        { label: '행사&프로그램', href: Links.business },
        { label: '해커톤' },
      ])
    })

    it('resolves /notices/records to 홈 > 공지사항 > 총회 및 이사회', () => {
      expect(resolveBreadcrumb(Links.noticesRecords)).toEqual([
        { label: '홈', href: Links.root },
        { label: '공지사항', href: Links.notices },
        { label: '총회 및 이사회' },
      ])
    })

    it('never links the last crumb', () => {
      const crumbs = resolveBreadcrumb(Links.introHistory)
      expect(crumbs[crumbs.length - 1].href).toBeUndefined()
    })

    it('links every crumb except the last one', () => {
      const crumbs = resolveBreadcrumb(Links.businessConference)
      expect(crumbs.slice(0, -1).every((crumb) => Boolean(crumb.href))).toBe(
        true,
      )
    })

    it('covers every registered sub menu of every section', () => {
      const sections = [IntroMenu, BusinessMenu, NoticesMenu]
      sections.forEach((section) => {
        section.subMenus.forEach((subMenu) => {
          expect(resolveBreadcrumb(subMenu.href)).toEqual([
            { label: '홈', href: Links.root },
            { label: section.label, href: section.href },
            { label: subMenu.label },
          ])
        })
      })
    })
  })

  describe('안내 및 공시 section', () => {
    it('resolves /info/privacy to 홈 > 안내 및 공시 > 개인정보처리방침', () => {
      expect(resolveBreadcrumb(Links.infoPrivacy)).toEqual([
        { label: '홈', href: Links.root },
        { label: '안내 및 공시' },
        { label: '개인정보처리방침' },
      ])
    })

    it('leaves the 안내 및 공시 crumb unlinked because its href is Links.root', () => {
      expect(InfoMenu.href).toBe(Links.root)
      const [, section] = resolveBreadcrumb(Links.infoTerms)
      expect(section).toEqual({ label: '안내 및 공시' })
      expect(section.href).toBeUndefined()
    })

    it('resolves /info/sitemap to 홈 > 안내 및 공시 > 사이트맵', () => {
      expect(resolveBreadcrumb(Links.infoSitemap)).toEqual([
        { label: '홈', href: Links.root },
        { label: '안내 및 공시' },
        { label: '사이트맵' },
      ])
    })

    it('covers every registered sub menu of InfoMenu', () => {
      InfoMenu.subMenus.forEach((subMenu) => {
        expect(resolveBreadcrumb(subMenu.href)).toEqual([
          { label: '홈', href: Links.root },
          { label: '안내 및 공시' },
          { label: subMenu.label },
        ])
      })
    })

    it('returns only 홈 for /info because it is not a registered page', () => {
      expect(resolveBreadcrumb('/info')).toEqual([
        { label: '홈', href: Links.root },
      ])
    })
  })

  describe('unknown paths', () => {
    it('returns only a linked 홈 crumb for an unknown top level path', () => {
      expect(resolveBreadcrumb('/nope')).toEqual([
        { label: '홈', href: Links.root },
      ])
    })

    it('returns only a linked 홈 crumb for an unknown nested path', () => {
      expect(resolveBreadcrumb('/nope/deeper')).toEqual([
        { label: '홈', href: Links.root },
      ])
    })

    it('keeps the 홈 crumb linked when it is not the current page', () => {
      const [home] = resolveBreadcrumb('/nope')
      expect(home.href).toBe(Links.root)
    })

    it('stops at the section for an unregistered page under /intro', () => {
      expect(resolveBreadcrumb('/intro/unknown')).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개', href: Links.intro },
      ])
    })

    it('stops at the section for an unregistered page under /notices', () => {
      expect(resolveBreadcrumb('/notices/unknown')).toEqual([
        { label: '홈', href: Links.root },
        { label: '공지사항', href: Links.notices },
      ])
    })

    it('stops at the section for a deeply nested page under /business', () => {
      expect(resolveBreadcrumb('/business/hackathon/2026')).toEqual([
        { label: '홈', href: Links.root },
        { label: '행사&프로그램', href: Links.business },
      ])
    })

    it('does not match a path that merely shares a section prefix', () => {
      expect(resolveBreadcrumb('/introduction')).toEqual([
        { label: '홈', href: Links.root },
      ])
    })

    it('does not match the admin path to any section', () => {
      expect(resolveBreadcrumb(Links.admin)).toEqual([
        { label: '홈', href: Links.root },
      ])
    })
  })

  describe('crumb shape', () => {
    it('returns a new array on every call', () => {
      expect(resolveBreadcrumb(Links.intro)).not.toBe(
        resolveBreadcrumb(Links.intro),
      )
    })

    it('returns crumbs whose labels are all non-empty', () => {
      const crumbs = resolveBreadcrumb(Links.noticesDonation)
      expect(crumbs.map((crumb) => crumb.label)).toEqual([
        '홈',
        '공지사항',
        '연간 기부금 모금액 및 활용실적',
      ])
    })
  })
})

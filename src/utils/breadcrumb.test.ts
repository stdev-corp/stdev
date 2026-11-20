import { describe, expect, it } from 'vitest'
import { resolveBreadcrumb } from '@/utils/breadcrumb'
import { Links } from '@/utils/links'
import {
  ConferenceMenu,
  HackathonMenu,
  InfoMenu,
  IntroMenu,
  NoticesMenu,
} from '@/utils/menus'

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

  describe('bare section paths (no page of their own)', () => {
    it('resolves /intro to 홈 > 법인소개', () => {
      expect(resolveBreadcrumb(IntroMenu.path)).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개' },
      ])
    })

    it('resolves /hackathon (the event list) to 홈 > 해커톤&아이디어톤 > 행사 소개', () => {
      expect(resolveBreadcrumb(HackathonMenu.path)).toEqual([
        { label: '홈', href: Links.root },
        { label: '해커톤&아이디어톤' },
        { label: '행사 소개' },
      ])
    })

    it('resolves /conference (the event list) to 홈 > 컨퍼런스&프로그램 > 행사 소개', () => {
      expect(resolveBreadcrumb(ConferenceMenu.path)).toEqual([
        { label: '홈', href: Links.root },
        { label: '컨퍼런스&프로그램' },
        { label: '행사 소개' },
      ])
    })

    it('resolves /notices to 홈 > 공지사항', () => {
      expect(resolveBreadcrumb(NoticesMenu.path)).toEqual([
        { label: '홈', href: Links.root },
        { label: '공지사항' },
      ])
    })

    it('resolves /info to 홈 > 안내 및 공시', () => {
      expect(resolveBreadcrumb(InfoMenu.path)).toEqual([
        { label: '홈', href: Links.root },
        { label: '안내 및 공시' },
      ])
    })
  })

  describe('leaf pages', () => {
    it('resolves /intro/about to 홈 > 법인소개 > 사단법인 에스티데브', () => {
      expect(resolveBreadcrumb(Links.introAbout)).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개' },
        { label: '사단법인 에스티데브' },
      ])
    })

    it('resolves /intro/history to 홈 > 법인소개 > 연혁', () => {
      expect(resolveBreadcrumb(Links.introHistory)).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개' },
        { label: '연혁' },
      ])
    })

    it('resolves /intro/chart to 홈 > 법인소개 > 조직도', () => {
      expect(resolveBreadcrumb(Links.introChart)).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개' },
        { label: '조직도' },
      ])
    })

    it('resolves /hackathon/news to 홈 > 해커톤&아이디어톤 > 뉴스 기사, not 행사 소개', () => {
      expect(resolveBreadcrumb(Links.hackathonNews)).toEqual([
        { label: '홈', href: Links.root },
        { label: '해커톤&아이디어톤' },
        { label: '뉴스 기사' },
      ])
    })

    it('resolves /conference/blog to 홈 > 컨퍼런스&프로그램 > 참여후기', () => {
      expect(resolveBreadcrumb(Links.conferenceBlog)).toEqual([
        { label: '홈', href: Links.root },
        { label: '컨퍼런스&프로그램' },
        { label: '참여후기' },
      ])
    })

    it('resolves /notices/records to 홈 > 공지사항 > 총회 및 이사회', () => {
      expect(resolveBreadcrumb(Links.noticesRecords)).toEqual([
        { label: '홈', href: Links.root },
        { label: '공지사항' },
        { label: '총회 및 이사회' },
      ])
    })

    it('never links the last crumb', () => {
      const crumbs = resolveBreadcrumb(Links.introHistory)
      expect(crumbs[crumbs.length - 1].href).toBeUndefined()
    })

    it('links only 홈 because sections have no page of their own', () => {
      const crumbs = resolveBreadcrumb(Links.conferenceNews)
      expect(crumbs.map((crumb) => crumb.href)).toEqual([
        Links.root,
        undefined,
        undefined,
      ])
    })

    it('covers every registered sub menu of every section', () => {
      const sections = [IntroMenu, HackathonMenu, ConferenceMenu, NoticesMenu]
      sections.forEach((section) => {
        section.subMenus.forEach((subMenu) => {
          expect(resolveBreadcrumb(subMenu.href)).toEqual([
            { label: '홈', href: Links.root },
            { label: section.label },
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

    it('leaves the 안내 및 공시 crumb unlinked like every other section', () => {
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

    it('stops at the section for an unregistered page under /info', () => {
      expect(resolveBreadcrumb('/info/unknown')).toEqual([
        { label: '홈', href: Links.root },
        { label: '안내 및 공시' },
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
        { label: '법인소개' },
      ])
    })

    it('stops at the section for an unregistered page under /notices', () => {
      expect(resolveBreadcrumb('/notices/unknown')).toEqual([
        { label: '홈', href: Links.root },
        { label: '공지사항' },
      ])
    })

    it('treats the removed /business section as unknown', () => {
      expect(resolveBreadcrumb('/business/hackathon')).toEqual([
        { label: '홈', href: Links.root },
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

  describe('event pages below a sub menu', () => {
    it('links the sub menu when the path is deeper than it, even without a trail', () => {
      expect(resolveBreadcrumb('/hackathon/dsf26')).toEqual([
        { label: '홈', href: Links.root },
        { label: '해커톤&아이디어톤' },
        { label: '행사 소개', href: Links.hackathon },
      ])
    })

    it('appends the trail after a linked 행사 소개 crumb', () => {
      expect(
        resolveBreadcrumb('/hackathon/dsf26', [{ label: 'DSF 2026' }]),
      ).toEqual([
        { label: '홈', href: Links.root },
        { label: '해커톤&아이디어톤' },
        { label: '행사 소개', href: Links.hackathon },
        { label: 'DSF 2026' },
      ])
    })

    it('keeps linked ancestors from the trail for nested event pages', () => {
      expect(
        resolveBreadcrumb('/conference/conf26/notice/team', [
          { label: 'Conf 2026', href: '/conference/conf26' },
          { label: '공지', href: '/conference/conf26/notice' },
          { label: '팀 빌딩' },
        ]),
      ).toEqual([
        { label: '홈', href: Links.root },
        { label: '컨퍼런스&프로그램' },
        { label: '행사 소개', href: Links.conference },
        { label: 'Conf 2026', href: '/conference/conf26' },
        { label: '공지', href: '/conference/conf26/notice' },
        { label: '팀 빌딩' },
      ])
    })

    it('links the sub menu when a trail is given even if the path equals its href', () => {
      expect(resolveBreadcrumb(Links.hackathon, [{ label: '상세' }])).toEqual([
        { label: '홈', href: Links.root },
        { label: '해커톤&아이디어톤' },
        { label: '행사 소개', href: Links.hackathon },
        { label: '상세' },
      ])
    })

    it('treats an empty trail like no trail', () => {
      expect(resolveBreadcrumb(Links.hackathon, [])).toEqual(
        resolveBreadcrumb(Links.hackathon),
      )
    })

    it('links the matching longer sub menu for pages below news or blog', () => {
      expect(resolveBreadcrumb(`${Links.hackathonBlog}/2026`)).toEqual([
        { label: '홈', href: Links.root },
        { label: '해커톤&아이디어톤' },
        { label: '참여후기', href: Links.hackathonBlog },
      ])
    })

    it('links a static sub menu too when the path goes deeper', () => {
      expect(resolveBreadcrumb(`${Links.introAbout}/more`)).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개' },
        { label: '사단법인 에스티데브', href: Links.introAbout },
      ])
    })

    it('appends the trail directly after the section when no sub menu matches', () => {
      expect(
        resolveBreadcrumb('/intro/unknown', [{ label: '알 수 없음' }]),
      ).toEqual([
        { label: '홈', href: Links.root },
        { label: '법인소개' },
        { label: '알 수 없음' },
      ])
    })

    it('ignores the trail on the root and on unknown paths', () => {
      expect(resolveBreadcrumb(Links.root, [{ label: 'x' }])).toEqual([
        { label: '홈' },
      ])
      expect(resolveBreadcrumb('/nope', [{ label: 'x' }])).toEqual([
        { label: '홈', href: Links.root },
      ])
    })

    it('does not mutate the trail it is given', () => {
      const trail = [{ label: 'DSF 2026' }]
      resolveBreadcrumb('/hackathon/dsf26', trail)
      expect(trail).toEqual([{ label: 'DSF 2026' }])
    })
  })

  describe('crumb shape', () => {
    it('returns a new array on every call', () => {
      expect(resolveBreadcrumb(Links.introAbout)).not.toBe(
        resolveBreadcrumb(Links.introAbout),
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

import { describe, expect, it } from 'vitest'
import Menus, {
  AllMenus,
  ConferenceMenu,
  HackathonMenu,
  InfoMenu,
  IntroMenu,
  NoticesMenu,
  findActiveSubMenu,
  findMenuSection,
} from '@/utils/menus'
import { Links } from '@/utils/links'

describe('menus', () => {
  describe('IntroMenu', () => {
    it('has label 법인소개', () => {
      expect(IntroMenu.label).toBe('법인소개')
    })

    it('has path /intro', () => {
      expect(IntroMenu.path).toBe('/intro')
    })

    it('has exactly 5 subMenus', () => {
      expect(IntroMenu.subMenus).toHaveLength(5)
    })

    it('first subMenu 사단법인 에스티데브 points to Links.introAbout', () => {
      expect(IntroMenu.subMenus[0]).toEqual({
        label: '사단법인 에스티데브',
        href: Links.introAbout,
      })
    })

    it('subMenu 연혁 points to Links.introHistory', () => {
      const item = IntroMenu.subMenus.find((m) => m.label === '연혁')
      expect(item?.href).toBe(Links.introHistory)
    })

    it('subMenu 조직도 points to Links.introChart', () => {
      const item = IntroMenu.subMenus.find((m) => m.label === '조직도')
      expect(item?.href).toBe(Links.introChart)
    })

    it('subMenu 리더십 points to Links.introDirectors', () => {
      const item = IntroMenu.subMenus.find((m) => m.label === '리더십')
      expect(item?.href).toBe(Links.introDirectors)
    })

    it('subMenu 정관 points to Links.introArticles', () => {
      const item = IntroMenu.subMenus.find((m) => m.label === '정관')
      expect(item?.href).toBe(Links.introArticles)
    })
  })

  describe('HackathonMenu', () => {
    it('has label 해커톤&아이디어톤', () => {
      expect(HackathonMenu.label).toBe('해커톤&아이디어톤')
    })

    it('has path /hackathon', () => {
      expect(HackathonMenu.path).toBe('/hackathon')
    })

    it('lists 행사 소개, 뉴스 기사, 참여후기 in order', () => {
      expect(HackathonMenu.subMenus).toEqual([
        { label: '행사 소개', href: Links.hackathon },
        { label: '뉴스 기사', href: Links.hackathonNews },
        { label: '참여후기', href: Links.hackathonBlog },
      ])
    })

    it('행사 소개 is the section path itself (the event list page)', () => {
      expect(HackathonMenu.subMenus[0].href).toBe(HackathonMenu.path)
    })
  })

  describe('ConferenceMenu', () => {
    it('has label 컨퍼런스&프로그램', () => {
      expect(ConferenceMenu.label).toBe('컨퍼런스&프로그램')
    })

    it('has path /conference', () => {
      expect(ConferenceMenu.path).toBe('/conference')
    })

    it('lists 행사 소개, 뉴스 기사, 참여후기 in order', () => {
      expect(ConferenceMenu.subMenus).toEqual([
        { label: '행사 소개', href: Links.conference },
        { label: '뉴스 기사', href: Links.conferenceNews },
        { label: '참여후기', href: Links.conferenceBlog },
      ])
    })

    it('행사 소개 is the section path itself (the event list page)', () => {
      expect(ConferenceMenu.subMenus[0].href).toBe(ConferenceMenu.path)
    })
  })

  describe('NoticesMenu', () => {
    it('has label 공지사항', () => {
      expect(NoticesMenu.label).toBe('공지사항')
    })

    it('has path /notices', () => {
      expect(NoticesMenu.path).toBe('/notices')
    })

    it('has exactly 3 subMenus', () => {
      expect(NoticesMenu.subMenus).toHaveLength(3)
    })

    it('subMenu 보도자료 points to Links.noticesPress', () => {
      const item = NoticesMenu.subMenus.find((m) => m.label === '보도자료')
      expect(item?.href).toBe(Links.noticesPress)
    })

    it('subMenu 연간 기부금 모금액 및 활용실적 points to Links.noticesDonation', () => {
      const item = NoticesMenu.subMenus.find(
        (m) => m.label === '연간 기부금 모금액 및 활용실적',
      )
      expect(item?.href).toBe(Links.noticesDonation)
    })

    it('subMenu 총회 및 이사회 points to Links.noticesRecords', () => {
      const item = NoticesMenu.subMenus.find(
        (m) => m.label === '총회 및 이사회',
      )
      expect(item?.href).toBe(Links.noticesRecords)
    })
  })

  describe('InfoMenu', () => {
    it('has label 안내 및 공시', () => {
      expect(InfoMenu.label).toBe('안내 및 공시')
    })

    it('has path /info', () => {
      expect(InfoMenu.path).toBe('/info')
    })

    it('has exactly 3 subMenus', () => {
      expect(InfoMenu.subMenus).toHaveLength(3)
    })

    it('subMenu 개인정보처리방침 points to Links.infoPrivacy', () => {
      const item = InfoMenu.subMenus.find((m) => m.label === '개인정보처리방침')
      expect(item?.href).toBe(Links.infoPrivacy)
    })

    it('subMenu 이용약관 points to Links.infoTerms', () => {
      const item = InfoMenu.subMenus.find((m) => m.label === '이용약관')
      expect(item?.href).toBe(Links.infoTerms)
    })

    it('subMenu 사이트맵 points to Links.infoSitemap', () => {
      const item = InfoMenu.subMenus.find((m) => m.label === '사이트맵')
      expect(item?.href).toBe(Links.infoSitemap)
    })
  })

  describe('default Menus export', () => {
    it('is 법인소개, 해커톤&아이디어톤, 컨퍼런스&프로그램, 공지사항 in order', () => {
      expect(Menus).toEqual([
        IntroMenu,
        HackathonMenu,
        ConferenceMenu,
        NoticesMenu,
      ])
      expect(Menus.map((menu) => menu.label)).toEqual([
        '법인소개',
        '해커톤&아이디어톤',
        '컨퍼런스&프로그램',
        '공지사항',
      ])
    })

    it('no longer has the 행사&프로그램 (/business) section', () => {
      expect(AllMenus.map((menu) => menu.path)).not.toContain('/business')
      expect(AllMenus.map((menu) => menu.label)).not.toContain('행사&프로그램')
    })

    it('does NOT contain InfoMenu', () => {
      expect(Menus).not.toContain(InfoMenu)
    })

    it('all subMenu hrefs start with /', () => {
      Menus.forEach((menu) => {
        menu.subMenus.forEach((sub) => {
          expect(sub.href.startsWith('/')).toBe(true)
        })
      })
    })

    it('every subMenu href is its section path or lives under it', () => {
      AllMenus.forEach((menu) => {
        menu.subMenus.forEach((sub) => {
          expect(
            sub.href === menu.path || sub.href.startsWith(`${menu.path}/`),
          ).toBe(true)
        })
      })
    })

    it('subMenu hrefs are unique across the site', () => {
      const hrefs = AllMenus.flatMap((menu) =>
        menu.subMenus.map((sub) => sub.href),
      )
      expect(new Set(hrefs).size).toBe(hrefs.length)
    })
  })

  describe('AllMenus', () => {
    it('is the four nav menus plus InfoMenu', () => {
      expect(AllMenus).toEqual([...Menus, InfoMenu])
    })
  })

  describe('findMenuSection', () => {
    it('matches a bare section path even though it has no page', () => {
      expect(findMenuSection(IntroMenu.path)).toBe(IntroMenu)
      expect(findMenuSection(HackathonMenu.path)).toBe(HackathonMenu)
      expect(findMenuSection(ConferenceMenu.path)).toBe(ConferenceMenu)
      expect(findMenuSection(NoticesMenu.path)).toBe(NoticesMenu)
      expect(findMenuSection(InfoMenu.path)).toBe(InfoMenu)
    })

    it('matches a path nested under a section', () => {
      expect(findMenuSection(Links.introAbout)).toBe(IntroMenu)
      expect(findMenuSection(Links.introHistory)).toBe(IntroMenu)
      expect(findMenuSection('/hackathon/dsf26')).toBe(HackathonMenu)
      expect(findMenuSection('/hackathon/dsf26/notice/team')).toBe(
        HackathonMenu,
      )
      expect(findMenuSection(Links.conferenceBlog)).toBe(ConferenceMenu)
    })

    it('matches InfoMenu pages under /info', () => {
      expect(findMenuSection(Links.infoPrivacy)).toBe(InfoMenu)
      expect(findMenuSection(Links.infoTerms)).toBe(InfoMenu)
      expect(findMenuSection(Links.infoSitemap)).toBe(InfoMenu)
    })

    it('does not treat the root path as a section', () => {
      expect(findMenuSection(Links.root)).toBeUndefined()
    })

    it('does not match a path that merely shares a section prefix', () => {
      expect(findMenuSection('/introduction')).toBeUndefined()
      expect(findMenuSection('/hackathons')).toBeUndefined()
      expect(findMenuSection('/conference-2026')).toBeUndefined()
    })

    it('returns undefined for an unknown or missing path', () => {
      expect(findMenuSection('/nope')).toBeUndefined()
      expect(findMenuSection('/business/hackathon')).toBeUndefined()
      expect(findMenuSection(null)).toBeUndefined()
      expect(findMenuSection(undefined)).toBeUndefined()
      expect(findMenuSection('')).toBeUndefined()
    })
  })

  describe('findActiveSubMenu', () => {
    it('returns the sub menu whose href equals the path', () => {
      expect(findActiveSubMenu(IntroMenu, Links.introHistory)).toBe(
        IntroMenu.subMenus[1],
      )
      expect(findActiveSubMenu(HackathonMenu, Links.hackathon)).toBe(
        HackathonMenu.subMenus[0],
      )
    })

    it('prefers the longest matching prefix over the section list page', () => {
      // /hackathon/news matches both 행사 소개(/hackathon) and 뉴스 기사(/hackathon/news)
      expect(findActiveSubMenu(HackathonMenu, Links.hackathonNews)?.label).toBe(
        '뉴스 기사',
      )
      expect(
        findActiveSubMenu(ConferenceMenu, Links.conferenceBlog)?.label,
      ).toBe('참여후기')
      expect(
        findActiveSubMenu(ConferenceMenu, `${Links.conferenceBlog}/2026`)
          ?.label,
      ).toBe('참여후기')
    })

    it('puts an event page under 행사 소개', () => {
      expect(findActiveSubMenu(HackathonMenu, '/hackathon/dsf26')).toBe(
        HackathonMenu.subMenus[0],
      )
      expect(
        findActiveSubMenu(ConferenceMenu, '/conference/conf26/notice/team'),
      ).toBe(ConferenceMenu.subMenus[0])
    })

    it('does not match a sibling that merely shares a prefix', () => {
      expect(findActiveSubMenu(HackathonMenu, '/hackathon/newsletter')).toBe(
        HackathonMenu.subMenus[0],
      )
      expect(findActiveSubMenu(IntroMenu, '/intro/abouts')).toBeUndefined()
      expect(findActiveSubMenu(HackathonMenu, '/hackathons')).toBeUndefined()
    })

    it('returns undefined when nothing matches or the path is missing', () => {
      expect(findActiveSubMenu(IntroMenu, '/intro')).toBeUndefined()
      expect(findActiveSubMenu(IntroMenu, '/intro/unknown')).toBeUndefined()
      expect(findActiveSubMenu(IntroMenu, Links.hackathon)).toBeUndefined()
      expect(findActiveSubMenu(IntroMenu, null)).toBeUndefined()
      expect(findActiveSubMenu(IntroMenu, undefined)).toBeUndefined()
      expect(findActiveSubMenu(IntroMenu, '')).toBeUndefined()
    })
  })
})

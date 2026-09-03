import { describe, expect, it } from 'vitest'
import Menus, {
  AllMenus,
  BusinessMenu,
  InfoMenu,
  IntroMenu,
  NoticesMenu,
  findMenuSection,
} from '@/utils/menus'
import { Links } from '@/utils/links'

describe('menus', () => {
  describe('IntroMenu', () => {
    it('has label 법인소개', () => {
      expect(IntroMenu.label).toBe('법인소개')
    })

    it('has href equal to Links.intro', () => {
      expect(IntroMenu.href).toBe(Links.intro)
    })

    it('has exactly 4 subMenus', () => {
      expect(IntroMenu.subMenus).toHaveLength(4)
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

  describe('BusinessMenu', () => {
    it('has label 행사&프로그램', () => {
      expect(BusinessMenu.label).toBe('행사&프로그램')
    })

    it('has href equal to Links.business', () => {
      expect(BusinessMenu.href).toBe(Links.business)
    })

    it('has exactly 4 subMenus', () => {
      expect(BusinessMenu.subMenus).toHaveLength(4)
    })

    it('subMenu 해커톤 points to Links.businessHackathon', () => {
      const item = BusinessMenu.subMenus.find((m) => m.label === '해커톤')
      expect(item?.href).toBe(Links.businessHackathon)
    })

    it('subMenu 컨퍼런스 points to Links.businessConference', () => {
      const item = BusinessMenu.subMenus.find((m) => m.label === '컨퍼런스')
      expect(item?.href).toBe(Links.businessConference)
    })

    it('subMenu 뉴스 기사 points to Links.businessNews', () => {
      const item = BusinessMenu.subMenus.find((m) => m.label === '뉴스 기사')
      expect(item?.href).toBe(Links.businessNews)
    })

    it('subMenu 참여후기 points to Links.businessBlog', () => {
      const item = BusinessMenu.subMenus.find((m) => m.label === '참여후기')
      expect(item?.href).toBe(Links.businessBlog)
    })
  })

  describe('NoticesMenu', () => {
    it('has label 공지사항', () => {
      expect(NoticesMenu.label).toBe('공지사항')
    })

    it('has href equal to Links.notices', () => {
      expect(NoticesMenu.href).toBe(Links.notices)
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
    it('contains exactly 3 items', () => {
      expect(Menus).toHaveLength(3)
    })

    it('first entry is IntroMenu', () => {
      expect(Menus[0]).toBe(IntroMenu)
    })

    it('second entry is BusinessMenu', () => {
      expect(Menus[1]).toBe(BusinessMenu)
    })

    it('third entry is NoticesMenu', () => {
      expect(Menus[2]).toBe(NoticesMenu)
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
  })

  describe('AllMenus', () => {
    it('is the three nav menus plus InfoMenu', () => {
      expect(AllMenus).toEqual([...Menus, InfoMenu])
    })
  })

  describe('findMenuSection', () => {
    it('matches a section index path', () => {
      expect(findMenuSection(Links.intro)).toBe(IntroMenu)
      expect(findMenuSection(Links.business)).toBe(BusinessMenu)
      expect(findMenuSection(Links.notices)).toBe(NoticesMenu)
    })

    it('matches a path nested under a section', () => {
      expect(findMenuSection(Links.introHistory)).toBe(IntroMenu)
      expect(findMenuSection('/business/hackathon/2026')).toBe(BusinessMenu)
    })

    it('matches InfoMenu through its sub menus even though its href is the root', () => {
      expect(findMenuSection(Links.infoPrivacy)).toBe(InfoMenu)
      expect(findMenuSection(Links.infoTerms)).toBe(InfoMenu)
      expect(findMenuSection(Links.infoSitemap)).toBe(InfoMenu)
    })

    it('does not treat the root path as a section', () => {
      expect(findMenuSection(Links.root)).toBeUndefined()
    })

    it('does not match a path that merely shares a section prefix', () => {
      expect(findMenuSection('/introduction')).toBeUndefined()
    })

    it('returns undefined for an unknown or missing path', () => {
      expect(findMenuSection('/nope')).toBeUndefined()
      expect(findMenuSection(null)).toBeUndefined()
      expect(findMenuSection(undefined)).toBeUndefined()
    })
  })
})

import { Links } from '@/utils/links'

export type Menu = {
  label: string
  href: string
  subMenus: {
    label: string
    href: string
  }[]
}

export const IntroMenu: Menu = {
  label: '법인소개',
  href: Links.intro,
  subMenus: [
    { label: '연혁', href: Links.introHistory },
    { label: '조직도', href: Links.introChart },
    { label: '리더십', href: Links.introDirectors },
    { label: '정관', href: Links.introArticles },
  ],
}

export const BusinessMenu: Menu = {
  label: '행사&프로그램',
  href: Links.business,
  subMenus: [
    { label: '해커톤', href: Links.businessHackathon },
    { label: '컨퍼런스', href: Links.businessConference },
    { label: '뉴스 기사', href: Links.businessNews },
    { label: '참여후기', href: Links.businessBlog },
  ],
}

export const NoticesMenu: Menu = {
  label: '공지사항',
  href: Links.notices,
  subMenus: [
    { label: '보도자료', href: Links.noticesPress },
    { label: '연간 기부금 모금액 및 활용실적', href: Links.noticesDonation },
    { label: '총회 및 이사회', href: Links.noticesRecords },
  ],
}

export const InfoMenu: Menu = {
  label: '안내 및 공시',
  href: Links.root,
  subMenus: [
    { label: '개인정보처리방침', href: Links.infoPrivacy },
    { label: '이용약관', href: Links.infoTerms },
    { label: '사이트맵', href: Links.infoSitemap },
  ],
}

const Menus: Menu[] = [IntroMenu, BusinessMenu, NoticesMenu]

export default Menus

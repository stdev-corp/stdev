import { Links } from '@/utils/links'

export type Menu = {
  label: string
  /**
   * 구역의 경로 접두사(예: '/intro'). 구역 자체의 페이지는 없고 하위 메뉴가
   * 곧 페이지이므로 링크로 쓰지 않는다. 현재 구역 판별에만 쓴다.
   */
  path: string
  subMenus: {
    label: string
    href: string
  }[]
}

export const IntroMenu: Menu = {
  label: '법인소개',
  path: '/intro',
  subMenus: [
    { label: '사단법인 에스티데브', href: Links.introAbout },
    { label: '연혁', href: Links.introHistory },
    { label: '조직도', href: Links.introChart },
    { label: '리더십', href: Links.introDirectors },
    { label: '정관', href: Links.introArticles },
  ],
}

export const BusinessMenu: Menu = {
  label: '행사&프로그램',
  path: '/business',
  subMenus: [
    { label: '해커톤', href: Links.businessHackathon },
    { label: '컨퍼런스', href: Links.businessConference },
    { label: '뉴스 기사', href: Links.businessNews },
    { label: '참여후기', href: Links.businessBlog },
  ],
}

export const NoticesMenu: Menu = {
  label: '공지사항',
  path: '/notices',
  subMenus: [
    { label: '보도자료', href: Links.noticesPress },
    { label: '연간 기부금 모금액 및 활용실적', href: Links.noticesDonation },
    { label: '총회 및 이사회', href: Links.noticesRecords },
  ],
}

export const InfoMenu: Menu = {
  label: '안내 및 공시',
  path: '/info',
  subMenus: [
    { label: '개인정보처리방침', href: Links.infoPrivacy },
    { label: '이용약관', href: Links.infoTerms },
    { label: '사이트맵', href: Links.infoSitemap },
  ],
}

const Menus: Menu[] = [IntroMenu, BusinessMenu, NoticesMenu]

/** 주 메뉴에 InfoMenu까지 더한, 사이트의 모든 구역. */
export const AllMenus: Menu[] = [...Menus, InfoMenu]

/**
 * 경로가 속한 구역을 찾는다.
 *
 * '/introduction'이 '/intro' 구역으로 잡히지 않도록 경로 구분자까지 확인한다.
 */
export function findMenuSection(pathname: string | null | undefined) {
  if (!pathname) {
    return undefined
  }

  return AllMenus.find(
    (menu) => pathname === menu.path || pathname.startsWith(`${menu.path}/`),
  )
}

export default Menus

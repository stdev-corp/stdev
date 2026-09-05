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

/** 주 메뉴에 InfoMenu까지 더한, 사이트의 모든 구역. */
export const AllMenus: Menu[] = [...Menus, InfoMenu]

/**
 * 경로가 속한 구역을 찾는다.
 *
 * - '/introduction'이 '/intro' 구역으로 잡히지 않도록 경로 구분자까지 확인한다.
 * - InfoMenu처럼 href가 루트인 구역은 하위 메뉴로만 판별해, 홈에서 잘못
 *   선택되지 않게 한다.
 */
export function findMenuSection(pathname: string | null | undefined) {
  if (!pathname) {
    return undefined
  }

  return AllMenus.find(
    (menu) =>
      (menu.href !== Links.root &&
        (pathname === menu.href || pathname.startsWith(`${menu.href}/`))) ||
      menu.subMenus.some((subMenu) => subMenu.href === pathname),
  )
}

export default Menus

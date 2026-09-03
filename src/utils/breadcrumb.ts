import { Links } from '@/utils/links'
import { BusinessMenu, InfoMenu, IntroMenu, NoticesMenu } from '@/utils/menus'
import type { Menu } from '@/utils/menus'

export type Crumb = {
  label: string
  href?: string
}

const Sections: Menu[] = [IntroMenu, BusinessMenu, NoticesMenu, InfoMenu]

function matchesSection(menu: Menu, pathname: string): boolean {
  // '/introduction'이 '/intro' 구역으로 잡히지 않도록 경로 구분자까지 확인한다.
  if (
    menu.href !== Links.root &&
    (pathname === menu.href || pathname.startsWith(`${menu.href}/`))
  ) {
    return true
  }
  return menu.subMenus.some((subMenu) => subMenu.href === pathname)
}

/**
 * 현재 경로에 대응하는 KRDS 브레드크럼 경로를 만든다.
 * 마지막 항목은 현재 페이지이므로 링크를 갖지 않는다.
 */
export function resolveBreadcrumb(pathname: string): Crumb[] {
  const home: Crumb = { label: '홈', href: Links.root }

  if (pathname === Links.root) {
    return [{ label: '홈' }]
  }

  const section = Sections.find((menu) => matchesSection(menu, pathname))
  if (!section) {
    return [home]
  }

  // 안내 및 공시처럼 자체 인덱스 페이지가 없는 구역은 링크 없이 표시한다.
  const sectionCrumb: Crumb =
    section.href === Links.root
      ? { label: section.label }
      : { label: section.label, href: section.href }

  if (pathname === section.href) {
    return [home, { label: section.label }]
  }

  const subMenu = section.subMenus.find((menu) => menu.href === pathname)
  if (!subMenu) {
    return [home, sectionCrumb]
  }

  return [home, sectionCrumb, { label: subMenu.label }]
}

import { Links } from '@/utils/links'
import { findActiveSubMenu, findMenuSection } from '@/utils/menus'

export type Crumb = {
  label: string
  href?: string
}

/**
 * 현재 경로에 대응하는 KRDS 브레드크럼 경로를 만든다.
 * 마지막 항목은 현재 페이지이므로 링크를 갖지 않는다.
 *
 * 행사 페이지처럼 메뉴에 없는 하위 페이지는 trail로 이어 붙인다. 그때 메뉴
 * 항목은 상위 페이지가 되므로 링크를 갖는다.
 */
export function resolveBreadcrumb(
  pathname: string,
  trail: Crumb[] = [],
): Crumb[] {
  const home: Crumb = { label: '홈', href: Links.root }

  if (pathname === Links.root) {
    return [{ label: '홈' }]
  }

  const section = findMenuSection(pathname)
  if (!section) {
    return [home]
  }

  // 구역 자체의 페이지는 없으므로 구역 항목은 링크를 갖지 않는다.
  const sectionCrumb: Crumb = { label: section.label }

  const subMenu = findActiveSubMenu(section, pathname)
  if (!subMenu) {
    return [home, sectionCrumb, ...trail]
  }

  if (trail.length === 0 && subMenu.href === pathname) {
    return [home, sectionCrumb, { label: subMenu.label }]
  }

  return [
    home,
    sectionCrumb,
    { label: subMenu.label, href: subMenu.href },
    ...trail,
  ]
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { findActiveSubMenu, type Menu } from '@/utils/menus'

type Props = {
  menu: Menu
}

export default function SideNavigation(props: Props) {
  const pathname = usePathname()
  // 메뉴에 없는 하위 페이지(행사 페이지)에서는 상위 메뉴 항목을 강조한다.
  const activeSubMenu = findActiveSubMenu(props.menu, pathname)

  return (
    <nav
      className="krds-side-navigation"
      aria-label={`${props.menu.label} 메뉴`}
    >
      <h2 className="lnb-tit">{props.menu.label}</h2>
      <ul className="lnb-list">
        {props.menu.subMenus.map((subMenu) => {
          const active = subMenu === activeSubMenu
          return (
            <li
              key={subMenu.href}
              className={active ? 'lnb-item active' : 'lnb-item'}
            >
              <Link
                href={subMenu.href}
                className={
                  active ? 'lnb-btn lnb-link active' : 'lnb-btn lnb-link'
                }
                aria-current={
                  active
                    ? pathname === subMenu.href
                      ? 'page'
                      : 'location'
                    : undefined
                }
              >
                {subMenu.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

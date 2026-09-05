'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Menu } from '@/utils/menus'

type Props = {
  menu: Menu
}

export default function SideNavigation(props: Props) {
  const pathname = usePathname()

  return (
    <nav
      className="krds-side-navigation"
      aria-label={`${props.menu.label} 메뉴`}
    >
      <h2 className="lnb-tit">{props.menu.label}</h2>
      <ul className="lnb-list">
        {props.menu.subMenus.map((subMenu) => {
          const active = pathname === subMenu.href
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
                aria-current={active ? 'page' : undefined}
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

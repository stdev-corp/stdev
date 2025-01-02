'use client'
import { Menu } from '@/utils/menus'
import { Listbox, ListboxItem, ListboxSection } from '@nextui-org/listbox'
import Link from 'next/link'

type LeftMenuProps = {
  menu: Menu
}

export default function LeftMenu(props: LeftMenuProps) {
  return (
    <div className="border-small px-1 py-2 rounded-small border-default-200 dark:border-default-100">
      <Listbox className="w-40">
        <ListboxSection showDivider>
          <ListboxItem
            key={props.menu.label}
            as={Link}
            href={props.menu.href}
            className="h-12"
          >
            {props.menu.label}
          </ListboxItem>
        </ListboxSection>
        <ListboxSection>
          {props.menu.subMenus.map((menu) => (
            <ListboxItem
              key={menu.label}
              as={Link}
              href={menu.href}
              className="h-12"
            >
              {menu.label}
            </ListboxItem>
          ))}
        </ListboxSection>
      </Listbox>
    </div>
  )
}

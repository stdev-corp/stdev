'use client'
import { Menu } from '@/utils/menus'
import { Select, SelectItem, SelectSection } from '@heroui/react'
import { usePathname, useRouter } from 'next/navigation'

type Props = {
  menu: Menu
}

export default function SubMenuSelect(props: Props) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Select
      className="p-4"
      selectedKeys={[pathname]}
      onSelectionChange={(keys) => {
        const [key] = Array.from(keys as Set<string>)
        router.push(key)
      }}
    >
      <SelectSection showDivider>
        <SelectItem key={props.menu.href} value={props.menu.href}>
          {props.menu.label}
        </SelectItem>
      </SelectSection>
      <SelectSection>
        {props.menu.subMenus.map((subMenu) => (
          <SelectItem key={subMenu.href} value={subMenu.href}>
            {subMenu.label}
          </SelectItem>
        ))}
      </SelectSection>
    </Select>
  )
}

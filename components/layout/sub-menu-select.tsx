'use client'
import { Menu } from '@/utils/menus'
import { Box } from '@chakra-ui/react'
import { usePathname, useRouter } from 'next/navigation'
import type { ChangeEvent } from 'react'

type Props = {
  menu: Menu
}

export default function SubMenuSelect(props: Props) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Box p={4}>
      <select
        value={pathname}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          router.push(event.target.value)
        }
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <option value={props.menu.href}>{props.menu.label}</option>
        {props.menu.subMenus.map((subMenu) => (
          <option key={subMenu.href} value={subMenu.href}>
            {subMenu.label}
          </option>
        ))}
      </select>
    </Box>
  )
}

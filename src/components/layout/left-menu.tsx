'use client'
import { Menu } from '@/utils/menus'
import { Box, Button, Separator, Stack } from '@chakra-ui/react'
import Link from 'next/link'

type LeftMenuProps = {
  menu: Menu
}

export default function LeftMenu(props: LeftMenuProps) {
  return (
    <Box borderWidth="1px" borderRadius="md" w="10rem" p={3}>
      <Stack gap={1} separator={<Separator />}>
        <Button
          key={props.menu.label}
          asChild
          variant="ghost"
          justifyContent="flex-start"
          fontWeight="bold"
        >
          <Link href={props.menu.href}>{props.menu.label}</Link>
        </Button>
        <Stack gap={1}>
          {props.menu.subMenus.map((menu) => (
            <Button
              key={menu.label}
              asChild
              variant="ghost"
              justifyContent="flex-start"
              size="sm"
            >
              <Link href={menu.href}>{menu.label}</Link>
            </Button>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

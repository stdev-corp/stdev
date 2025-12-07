'use client'
import { Links } from '@/utils/links'
import Menus from '@/utils/menus'
import {
  Box,
  Button,
  Flex,
  Link as ChakraLink,
  Menu,
  Stack,
  Text,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useState } from 'react'

function HamburgerIcon() {
  return (
    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 20 20">
      <path
        fill="currentColor"
        d="M1,4 H18 V6 H1 V4 M1,9 H18 V11 H1 V7 M3,14 H18 V16 H1 V14"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path
        d="M 10,10 L 30,30 M 30,10 L 10,30"
        stroke="black"
        stroke-width="4"
      />
    </svg>
  )
}

function DesktopMenu() {
  return (
    <Flex as="nav" align="center" gap={2}>
      {Menus.map((menu) => (
        <Menu.Root key={menu.label}>
          <Menu.Trigger asChild>
            <Button
              variant="ghost"
              fontWeight="medium"
              display="inline-flex"
              gap={1}
              alignItems="center"
            >
              {menu.label}
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item asChild value={`${menu.label}-all`}>
                <Link href={menu.href}>{menu.label}</Link>
              </Menu.Item>
              <Menu.Separator />
              {menu.subMenus.map((subMenu) => (
                <Menu.Item key={subMenu.label} asChild value={subMenu.label}>
                  <Link href={subMenu.href}>{subMenu.label}</Link>
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      ))}
    </Flex>
  )
}

export default function Navigation() {
  const [open, setOpen] = useState(false)

  return (
    <Box as="header" borderBottomWidth="1px" bg="white">
      <Flex align="center" h={16} px={{ base: 4, md: 8 }} gap={4}>
        <Button
          display={{ base: 'inline-flex', md: 'none' }}
          onClick={() => setOpen((prev) => !prev)}
          variant="ghost"
          aria-label={open ? '닫기' : '메뉴 열기'}
          p={2}
        >
          {open ? <CloseIcon /> : <HamburgerIcon />}
        </Button>
        <ChakraLink
          as={Link}
          href={Links.root}
          fontWeight="bold"
          _hover={{ textDecoration: 'none' }}
        >
          사단법인 STDev
        </ChakraLink>
        <Flex flex="1" />
        <Box display={{ base: 'none', md: 'block' }}>
          <DesktopMenu />
        </Box>
        <Button
          bg="teal.500"
          _hover={{ bg: 'teal.600' }}
          color="white"
          size="sm"
        >
          <Link href={Links.shop}>행사 참가하기</Link>
        </Button>
      </Flex>
      {open && (
        <Box px={4} pb={4} display={{ md: 'none' }} borderTopWidth="1px">
          <Stack gap={3}>
            {Menus.map((menu) => (
              <Box key={menu.label}>
                <Text fontWeight="semibold" mb={1}>
                  {menu.label}
                </Text>
                <Stack gap={1} pl={2}>
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    <Link href={menu.href}>전체보기</Link>
                  </Button>
                  {menu.subMenus.map((subMenu) => (
                    <Button
                      key={subMenu.label}
                      variant="ghost"
                      justifyContent="flex-start"
                      size="sm"
                      onClick={() => setOpen(false)}
                    >
                      <Link href={subMenu.href}>{subMenu.label}</Link>
                    </Button>
                  ))}
                </Stack>
              </Box>
            ))}
            <Button
              bg="teal.500"
              _hover={{ bg: 'teal.600' }}
              color="white"
              onClick={() => setOpen(false)}
            >
              <Link href={Links.shop}>행사 참가하기</Link>
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

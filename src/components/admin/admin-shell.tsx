'use client'

import {
  Box,
  Button,
  Drawer,
  Flex,
  Heading,
  IconButton,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { adminMenuItems, type AdminMenuItem } from './menu-items'
import { SignOutButton } from './sign-out-button'

const SIDEBAR_WIDTH = '15rem'

function HamburgerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      role="img"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M1,4 H18 V6 H1 V4 M1,9 H18 V11 H1 V9 M1,14 H18 V16 H1 V14"
      />
    </svg>
  )
}

function isItemActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarBody({
  pathname,
  onNavigate,
  sessionEmail,
}: {
  pathname: string
  onNavigate?: () => void
  sessionEmail: string
}) {
  return (
    <Flex direction="column" h="100%" bg="gray.900" color="white">
      <Box px={5} py={5} borderBottomWidth="1px" borderColor="gray.700">
        <Heading size="md">STDev CMS</Heading>
        <Text fontSize="xs" color="gray.400" mt={1} wordBreak="break-all">
          {sessionEmail}
        </Text>
      </Box>
      <Stack
        as="nav"
        gap={1}
        px={3}
        py={4}
        flex="1"
        overflowY="auto"
        align="stretch"
      >
        {adminMenuItems.map((item: AdminMenuItem) => {
          const active = isItemActive(pathname, item.href)
          return (
            <Button
              key={item.href}
              asChild
              variant={active ? 'solid' : 'ghost'}
              colorPalette={active ? 'teal' : undefined}
              justifyContent="flex-start"
              size="sm"
              color={active ? 'white' : 'gray.200'}
              _hover={{ bg: active ? undefined : 'gray.700' }}
              onClick={onNavigate}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          )
        })}
      </Stack>
      <Box px={4} py={4} borderTopWidth="1px" borderColor="gray.700">
        <SignOutButton />
      </Box>
    </Flex>
  )
}

export function AdminShell({
  sessionEmail,
  children,
}: {
  sessionEmail: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Flex minH="100vh" bg="gray.50">
      <Box
        as="aside"
        width={SIDEBAR_WIDTH}
        position="fixed"
        top={0}
        bottom={0}
        left={0}
        display={{ base: 'none', md: 'block' }}
        zIndex={10}
      >
        <SidebarBody pathname={pathname} sessionEmail={sessionEmail} />
      </Box>

      <Drawer.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content maxW={SIDEBAR_WIDTH}>
              <SidebarBody
                pathname={pathname}
                sessionEmail={sessionEmail}
                onNavigate={() => setOpen(false)}
              />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Box
        flex="1"
        ml={{ base: 0, md: SIDEBAR_WIDTH }}
        minH="100vh"
        display="flex"
        flexDirection="column"
      >
        <Box
          as="header"
          bg="white"
          borderBottomWidth="1px"
          h="3.5rem"
          display="flex"
          alignItems="center"
          px={{ base: 3, md: 6 }}
          gap={3}
        >
          <IconButton
            display={{ base: 'inline-flex', md: 'none' }}
            variant="ghost"
            aria-label="메뉴 열기"
            onClick={() => setOpen(true)}
          >
            <HamburgerIcon />
          </IconButton>
          <Heading size="sm" color="gray.700">
            관리자
          </Heading>
        </Box>
        <Box flex="1" p={{ base: 4, md: 8 }}>
          {children}
        </Box>
      </Box>
    </Flex>
  )
}

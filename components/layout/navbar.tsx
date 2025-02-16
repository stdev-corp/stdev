'use client'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/navbar'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown'
import { Button } from '@heroui/button'
import { signIn, signOut } from 'next-auth/react'
import { User } from 'next-auth'
import { Avatar } from '@heroui/avatar'
import { Links } from '@/utils/links'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Menus from '@/utils/menus'
import { useState } from 'react'

type MenuDropdownProps = {
  menus: {
    label: string
    href: string
    subMenus: {
      label: string
      href: string
    }[]
  }[]
}

function MenuDropdown(props: MenuDropdownProps) {
  const router = useRouter()

  return (
    <div className="w-full flex">
      <div className="group relative dropdown px-4 cursor-pointer flex flex-row gap-8">
        {props.menus.map((menu) => (
          <NavbarMenuItem
            key={menu.label}
            onClick={() => router.push(menu.href)}
          >
            {menu.label}
          </NavbarMenuItem>
        ))}
        <div className="group-hover:block dropdown-menu absolute hidden h-auto">
          <div className="top-0 mt-12 bg-white shadow px-6 py-12 flex flex-row">
            {props.menus.map((menu) => (
              <div key={menu.label} className="flex flex-col gap-4 w-28">
                {menu.subMenus.map((subMenu) => (
                  <Link key={subMenu.label} href={subMenu.href}>
                    {subMenu.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type Props = {
  user?: User
}

export default function Navigation(props: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Navbar isBordered isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="sm:hidden"
        />
        <NavbarBrand>
          <NavbarItem as={Link} href={Links.home}>
            <p className="font-bold text-inherit">사단법인 STDev</p>
          </NavbarItem>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex" justify="center">
        <MenuDropdown menus={Menus} />
      </NavbarContent>
      <NavbarMenu>
        {Menus.map((menu) => (
          <Link key={menu.label} href={menu.href}>
            <NavbarMenuItem onClick={() => setIsMenuOpen(false)}>
              {menu.label}
            </NavbarMenuItem>
          </Link>
        ))}
      </NavbarMenu>
      <NavbarContent justify="end">
        <NavbarItem className="flex gap-4">
          <Button
            color="secondary"
            as={Link}
            href={Links.products}
            className="hidden sm:flex"
          >
            행사 참가하기
          </Button>
          {props.user ? (
            <>
              {props.user.email?.endsWith('@stdev.kr') && (
                <Button as={Link} href={Links.admin}>
                  Admin
                </Button>
              )}
              <Dropdown>
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    src={props.user.image ?? undefined}
                    name={props.user.name ?? undefined}
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                  <DropdownItem key="profile" href={Links.my}>
                    <p>내 정보</p>
                    <div className="h-2" />
                    <p>{props.user.name}</p>
                    <div className="h-2" />
                    <p>{props.user.email}</p>
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    onPress={() => signOut()}
                  >
                    로그아웃
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </>
          ) : (
            <Button color="primary" variant="flat" onPress={() => signIn()}>
              로그인
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}

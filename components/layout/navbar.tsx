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
import { Button } from '@heroui/button'
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

export default function Navigation() {
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
      <NavbarMenu className="gap-4">
        {Menus.map((menu) => (
          <Link key={menu.label} href={menu.href}>
            <NavbarMenuItem onClick={() => setIsMenuOpen(false)}>
              {menu.label}
            </NavbarMenuItem>
          </Link>
        ))}
        <Button
          key="products"
          as={Link}
          color="primary"
          className="text-white"
          href={Links.products}
          onPress={() => setIsMenuOpen(false)}
        >
          행사 참가하기
        </Button>
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
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}

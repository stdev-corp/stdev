'use client'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuItem,
} from '@nextui-org/navbar'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@nextui-org/dropdown'
import { Button } from '@nextui-org/button'
import { signIn, signOut } from 'next-auth/react'
import { User } from 'next-auth'
import { Avatar } from '@nextui-org/avatar'
import { Links } from '@/utils/links'
import Link from 'next/link'

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
  return (
    <ul className="w-full flex">
      <li className="group relative dropdown px-4 cursor-pointer flex flex-row gap-8">
        {props.menus.map((menu) => (
          <NavbarMenuItem
            key={menu.label}
            as={Link}
            href={menu.href}
            className="z-10"
          >
            {menu.label}
          </NavbarMenuItem>
        ))}
        <div className="group-hover:block dropdown-menu absolute hidden h-auto">
          <div className="top-0 bg-white shadow px-6 py-12 flex flex-row">
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
      </li>
    </ul>
  )
}

type Props = {
  user?: User
}

export default function Navigation(props: Props) {
  return (
    <Navbar isBordered>
      <NavbarBrand>
        <NavbarItem as={Link} href={Links.home}>
          <p className="font-bold text-inherit">사단법인 STDev</p>
        </NavbarItem>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex" justify="center">
        <MenuDropdown
          menus={[
            {
              label: '법인소개',
              href: Links.intro,
              subMenus: [
                { label: '연혁', href: Links.introHistory },
                { label: '조직도', href: Links.introChart },
                { label: '이사회', href: Links.introDirectors },
                { label: '정관', href: Links.introArticles },
              ],
            },
            {
              label: '행사&프로그램',
              href: Links.business,
              subMenus: [
                { label: '해커톤', href: Links.businessHackathon },
                { label: '컨퍼런스', href: Links.businessConference },
                { label: '보도자료', href: Links.businessPress },
                { label: '참여후기', href: Links.businessReview },
              ],
            },
            {
              label: '공지사항',
              href: Links.notices,
              subMenus: [
                { label: '재정보고', href: Links.noticesDonation },
                { label: '회의록', href: Links.noticesMinutes },
              ],
            },
          ]}
        />
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          {props.user ? (
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
                  내 정보
                </DropdownItem>
                <DropdownItem key="name">{props.user.name}</DropdownItem>
                <DropdownItem key="email">{props.user.email}</DropdownItem>
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

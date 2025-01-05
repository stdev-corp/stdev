import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@nextui-org/navbar'
import { Button } from '@nextui-org/button'
import { ReactNode } from 'react'
import Link from 'next/link'
import { Links } from '@/utils/links'

type Props = {
  children: ReactNode
}

export default function Layout(props: Props) {
  return (
    <>
      <Navbar isBordered className="bg-gray-800 text-white">
        <NavbarBrand className="flex gap-8">
          <NavbarItem>
            <Button as={Link} href={Links.home}>
              홈페이지로 돌아가기
            </Button>
          </NavbarItem>
          <NavbarItem as={Link} href={Links.admin}>
            Admin
          </NavbarItem>
        </NavbarBrand>
        <NavbarContent className="flex gap-12">
          <NavbarItem as={Link} href={Links.adminRedirect}>
            단축 URL
          </NavbarItem>
          <NavbarItem as={Link} href={Links.adminUser}>
            사용자
          </NavbarItem>
          <NavbarItem as={Link} href={Links.adminMarkdown}>
            마크다운
          </NavbarItem>
          <NavbarItem as={Link} href={Links.adminProduct}>
            상품
          </NavbarItem>
          <NavbarItem as={Link} href={Links.adminRecord}>
            회의록
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <main className="p-12">{props.children}</main>
    </>
  )
}

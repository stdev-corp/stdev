'use client'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
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

type Props = {
  user?: User
}

export default function Navigation(props: Props) {
  return (
    <Navbar>
      <NavbarBrand>
        <NavbarItem as={Link} href={Links.home}>
          <p className="font-bold text-inherit">사단법인 STDev</p>
        </NavbarItem>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <Dropdown>
          <NavbarItem>
            <DropdownTrigger>
              <Button
                disableRipple
                className="p-0 bg-transparent data-[hover=true]:bg-transparent"
                radius="sm"
                variant="light"
              >
                Features
              </Button>
            </DropdownTrigger>
          </NavbarItem>
          <DropdownMenu
            aria-label="ACME features"
            className="w-[340px]"
            itemClasses={{
              base: 'gap-4',
            }}
          >
            <DropdownItem
              key="autoscaling"
              description="ACME scales apps to meet user demand, automagically, based on load."
            >
              Autoscaling
            </DropdownItem>
            <DropdownItem
              key="usage_metrics"
              description="Real-time metrics to debug issues. Slow query added? We’ll show you exactly where."
            >
              Usage Metrics
            </DropdownItem>
            <DropdownItem
              key="production_ready"
              description="ACME runs on ACME, join us and others serving requests at web scale."
            >
              Production Ready
            </DropdownItem>
            <DropdownItem
              key="99_uptime"
              description="Applications stay on the grid with high availability and high uptime guarantees."
            >
              +99% Uptime
            </DropdownItem>
            <DropdownItem
              key="supreme_support"
              description="Overcome any challenge with a supporting team ready to respond."
            >
              +Supreme Support
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <NavbarItem isActive>Customers</NavbarItem>
        <NavbarItem>Integrations</NavbarItem>
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

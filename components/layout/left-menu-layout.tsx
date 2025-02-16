import LeftMenu from '@/components/layout/left-menu'
import { Menu } from '@/utils/menus'
import { ReactNode } from 'react'
import SubMenuSelect from '@/components/layout/sub-menu-select'
import BasicLayout from '@/components/layout/basic-layout'

type Props = {
  menu: Menu
  children: ReactNode
}

export default function LeftMenuLayout(props: Props) {
  return (
    <>
      <div className="fixed top-28 left-12 hidden sm:block">
        <LeftMenu menu={props.menu} />
      </div>
      <div className="sm:hidden">
        <SubMenuSelect menu={props.menu} />
      </div>
      <BasicLayout>{props.children}</BasicLayout>
    </>
  )
}

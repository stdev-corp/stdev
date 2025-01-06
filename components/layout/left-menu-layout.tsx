import LeftMenu from '@/components/layout/left-menu'
import { Menu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  menu: Menu
  children: ReactNode
}

export default function LeftMenuLayout(props: Props) {
  return (
    <>
      <div className="fixed top-28 left-12">
        <LeftMenu menu={props.menu} />
      </div>
      <div className="relative max-w-5xl mx-auto px-8 py-12">
        {props.children}
      </div>
    </>
  )
}

import LeftMenu from '@/components/layout/left-menu'
import { Menu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  menu: Menu
  children: ReactNode
}

export default function LeftMenuLayout(props: Props) {
  return (
    <div>
      <div className="fixed top-28 left-12">
        <LeftMenu menu={props.menu} />
      </div>
      <div className="relative ml-64 max-w-4xl mx-auto px-4 py-12">
        {props.children}
      </div>
    </div>
  )
}

import LeftMenuLayout from '@/components/layout/left-menu-layout'
import { ProductsMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function IntroLayout(props: Props) {
  return <LeftMenuLayout menu={ProductsMenu}>{props.children}</LeftMenuLayout>
}

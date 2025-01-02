import LeftMenuLayout from '@/components/layout/left-menu-layout'
import { IntroMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function IntroLayout(props: Props) {
  return <LeftMenuLayout menu={IntroMenu}>{props.children}</LeftMenuLayout>
}

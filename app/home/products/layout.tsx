import LeftMenuLayout from '@/components/layout/left-menu-layout'
import { OrderMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const dynamic = 'force-dynamic'

export default function IntroLayout(props: Props) {
  return <LeftMenuLayout menu={OrderMenu}>{props.children}</LeftMenuLayout>
}

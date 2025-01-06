import LeftMenuLayout from '@/components/layout/left-menu-layout'
import { BusinessMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const dynamic = 'force-dynamic'

export default function BusinessLayout(props: Props) {
  return <LeftMenuLayout menu={BusinessMenu}>{props.children}</LeftMenuLayout>
}

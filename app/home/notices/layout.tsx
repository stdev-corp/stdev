import LeftMenuLayout from '@/components/layout/left-menu-layout'
import { NoticesMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const dynamic = 'force-dynamic'

export default function NoticesLayout(props: Props) {
  return <LeftMenuLayout menu={NoticesMenu}>{props.children}</LeftMenuLayout>
}

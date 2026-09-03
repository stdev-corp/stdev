import SiteLayout from '@/components/krds/site-layout'
import { NoticesMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function NoticesLayout(props: Props) {
  return <SiteLayout menu={NoticesMenu}>{props.children}</SiteLayout>
}

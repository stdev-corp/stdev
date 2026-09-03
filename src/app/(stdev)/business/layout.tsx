import SiteLayout from '@/components/krds/site-layout'
import { BusinessMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function BusinessLayout(props: Props) {
  return <SiteLayout menu={BusinessMenu}>{props.children}</SiteLayout>
}

import SiteLayout from '@/components/krds/site-layout'
import { InfoMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default async function Layout(props: Props) {
  return <SiteLayout menu={InfoMenu}>{props.children}</SiteLayout>
}

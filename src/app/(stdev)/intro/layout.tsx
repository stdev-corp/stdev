import SiteLayout from '@/components/krds/site-layout'
import { IntroMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function IntroLayout(props: Props) {
  return <SiteLayout menu={IntroMenu}>{props.children}</SiteLayout>
}

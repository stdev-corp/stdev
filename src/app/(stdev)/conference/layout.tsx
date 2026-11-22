import SiteLayout from '@/components/krds/site-layout'
import { ConferenceMenu } from '@/utils/menus'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

// 행사 페이지는 제목이 DB에 있어 브레드크럼을 페이지가 직접 그린다.
export default function ConferenceLayout(props: Props) {
  return (
    <SiteLayout menu={ConferenceMenu} breadcrumb={false}>
      {props.children}
    </SiteLayout>
  )
}

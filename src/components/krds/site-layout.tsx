import type { ReactNode } from 'react'
import Breadcrumb from '@/components/krds/breadcrumb'
import Footer from '@/components/krds/footer'
import Header from '@/components/krds/header'
import SideNavigation from '@/components/krds/side-navigation'
import SkipLink from '@/components/krds/skip-link'
import type { Menu } from '@/utils/menus'

type Props = {
  /** 좌측 LNB로 노출할 구역 메뉴. 없으면 단일 단으로 표시한다. */
  menu?: Menu
  /** 브레드크럼 노출 여부 */
  breadcrumb?: boolean
  children: ReactNode
}

export default function SiteLayout(props: Props) {
  const { breadcrumb = true } = props

  return (
    <div id="wrap" className="g-wrap">
      <SkipLink />
      <Header />
      <div id="container">
        <div className={props.menu ? 'inner in-between' : 'inner'}>
          {props.menu && <SideNavigation menu={props.menu} />}
          <div className="contents" id="krds-content" tabIndex={-1}>
            {breadcrumb && <Breadcrumb />}
            {props.children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

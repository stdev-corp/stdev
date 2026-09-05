import type { ReactNode } from 'react'
import Footer from '@/components/krds/footer'
import Header from '@/components/krds/header'
import SkipLink from '@/components/krds/skip-link'

type Props = {
  children: ReactNode
}

/** 메인 페이지처럼 좌우 여백 없이 전체 너비를 쓰는 화면용 골격. */
export default function MainLayout(props: Props) {
  return (
    <div id="wrap" className="g-wrap">
      <SkipLink />
      <Header />
      <div id="container" className="main-container">
        <div id="krds-content" tabIndex={-1}>
          {props.children}
        </div>
      </div>
      <Footer />
    </div>
  )
}

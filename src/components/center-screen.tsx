import { Links } from '@/utils/links'
import Link from 'next/link'
import { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
}

export default function CenterScreen(props: Props) {
  return (
    <div className="g-result-page">
      <div className="result-box">
        <h1 className="result-tit">{props.title}</h1>
        <div className="result-desc">{props.children}</div>
        <Link href={Links.root} className="krds-btn medium primary">
          홈페이지로 돌아가기
        </Link>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: ReactNode
}

export default function PageTitle(props: Props) {
  return (
    <div className="page-title-wrap">
      <h1 className="h-tit">{props.title}</h1>
      {props.description && (
        <div className="g-info-box">
          <p className="g-desc">{props.description}</p>
        </div>
      )}
    </div>
  )
}

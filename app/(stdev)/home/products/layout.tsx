import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function IntroLayout(props: Props) {
  return (
    <div className="relative max-w-5xl mx-auto px-8 py-12">
      {props.children}
    </div>
  )
}

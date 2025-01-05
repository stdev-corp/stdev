import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default async function WithLine(props: Props) {
  return (
    <div className="flex items-stretch gap-2 mt-8 mb-4">
      <div className="bg-primary w-1 rounded my-1" />
      <h2 className="my-0">{props.children}</h2>
    </div>
  )
}

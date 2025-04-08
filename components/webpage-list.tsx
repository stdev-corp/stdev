'use client'

import { Webpage } from '@/payload-types'
import { Divider } from '@heroui/divider'
import Link from 'next/link'

type WebpageWithBusiness = Pick<
  Webpage,
  'id' | 'title' | 'author' | 'url' | 'publishedDate'
> & {
  business_name: string
}

type Props = {
  webpages: WebpageWithBusiness[]
}

export default function WebpageList(props: Props) {
  const itemStyle = 'w-full flex flex-col py-4 gap-2'

  if (props.webpages.length === 0) {
    return (
      <>
        <Divider />
        <span className={itemStyle}>자료가 존재하지 않습니다.</span>
        <Divider />
      </>
    )
  }

  return (
    <>
      <Divider />
      {props.webpages.map((webpage) => (
        <Link key={webpage.id} href={webpage.url} target="_blank">
          <div className={itemStyle}>
            <span className="w-full font-bold">{webpage.title}</span>
            <div className="flex flex-row items-center gap-4">
              <span>{webpage.author}</span>
              <span>{webpage.publishedDate}</span>
              <div className="flex-1" />
              <span>{webpage.business_name}</span>
            </div>
          </div>
          <Divider />
        </Link>
      ))}
    </>
  )
}

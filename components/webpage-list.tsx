'use client'

import { toDateString } from '@/utils/datetime'
import { Divider } from '@nextui-org/divider'
import { Webpage } from '@prisma/client'
import Link from 'next/link'

type WebpageWithEvent = Pick<
  Webpage,
  'id' | 'title' | 'author' | 'url' | 'date'
> & {
  event: {
    title: string
    slug: string
  }
}

type Props = {
  webpages: WebpageWithEvent[]
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
              <span>({toDateString(webpage.date)})</span>
              <div className="flex-1" />
              <span>{webpage.event.title}</span>
            </div>
          </div>
          <Divider />
        </Link>
      ))}
    </>
  )
}

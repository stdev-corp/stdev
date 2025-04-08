'use client'
import { Divider } from '@heroui/divider'
import { Button } from '@heroui/button'
import Link from 'next/link'

type Props = {
  reports: {
    id: number
    title: string
    publishedDate: string
    file_url: string
  }[]
}

export default function RecordList(props: Props) {
  if (props.reports.length === 0) {
    return (
      <>
        <Divider />
        <span className="w-full h-12 flex flex-row items-center">
          자료가 존재하지 않습니다.
        </span>
        <Divider />
      </>
    )
  }

  return (
    <>
      <Divider />
      {props.reports.map((record) => (
        <div key={record.id}>
          <div className="w-full h-12 flex flex-row items-center">
            <span className="flex-1">{record.title}</span>
            <span className="">{record.publishedDate}</span>
            <div className="w-8" />
            <Button
              variant="bordered"
              as={Link}
              href={record.file_url}
              size="sm"
              target="_blank"
            >
              PDF
            </Button>
          </div>
          <Divider />
        </div>
      ))}
    </>
  )
}

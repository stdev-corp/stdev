'use client'
import { Divider } from '@nextui-org/divider'
import { Button } from '@nextui-org/button'
import { Record } from '@prisma/client'
import Link from 'next/link'
import { toDateString } from '@/utils/datetime'

type Props = {
  records: Record[]
}

export default function RecordList(props: Props) {
  if (props.records.length === 0) {
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
      {props.records.map((record) => (
        <div key={record.id}>
          <div className="w-full h-12 flex flex-row items-center">
            <span className="flex-1">{record.title}</span>
            <span className="">{toDateString(record.date)}</span>
            <div className="w-8" />
            <Button
              variant="bordered"
              as={Link}
              href={record.pdfUrl}
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

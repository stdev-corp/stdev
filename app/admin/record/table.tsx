'use client'
import { toDateString } from '@/utils/datetime'
import { toRecordTypeString } from '@/utils/prisma'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/table'
import { Record } from '@prisma/client'
import Link from 'next/link'

type Props = {
  records: Record[]
}

export default function RecordTable(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>ID</TableColumn>
        <TableColumn>유형</TableColumn>
        <TableColumn>제목</TableColumn>
        <TableColumn>날짜</TableColumn>
        <TableColumn>AWS S3 PDF</TableColumn>
      </TableHeader>
      <TableBody>
        {props.records.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{record.id}</TableCell>
            <TableCell>{toRecordTypeString(record.type)}</TableCell>
            <TableCell>{record.title}</TableCell>
            <TableCell>{toDateString(record.date)}</TableCell>
            <TableCell>
              <Link target="_blank" href={record.pdfUrl}>
                {record.pdfUrl}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

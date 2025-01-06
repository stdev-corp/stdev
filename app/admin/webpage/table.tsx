'use client'

import { toDateString } from '@/utils/datetime'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/table'
import { Webpage } from '@prisma/client'
import Link from 'next/link'

type Props = {
  webpages: Webpage[]
}

export default function WebpageTable(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>제목</TableColumn>
        <TableColumn>출처</TableColumn>
        <TableColumn>게재일</TableColumn>
        <TableColumn>URL</TableColumn>
      </TableHeader>
      <TableBody>
        {props.webpages.map((webpage) => (
          <TableRow key={webpage.id}>
            <TableCell>{webpage.title}</TableCell>
            <TableCell>{webpage.author}</TableCell>
            <TableCell>{toDateString(webpage.date)}</TableCell>
            <TableCell>
              <Link href={webpage.url} target="_blank">
                {webpage.url}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

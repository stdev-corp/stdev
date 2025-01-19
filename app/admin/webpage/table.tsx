'use client'

import { toDateString } from '@/utils/datetime'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/table'
import { Webpage } from '@prisma/client'
import Link from 'next/link'

type CustomeWithWebpage = Pick<
  Webpage,
  'id' | 'title' | 'author' | 'date' | 'url'
>

type Props = {
  webpages: CustomeWithWebpage[]
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

'use client'

import { toDateTimeString } from '@/utils/datetime'
import { Links } from '@/utils/links'
import { Button } from '@heroui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/table'
import { Markdown } from '@prisma/client'
import Link from 'next/link'

type Props = {
  markdowns: Omit<Markdown, 'content'>[]
}

export default function MarkdownsTable(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>카테고리</TableColumn>
        <TableColumn>제목</TableColumn>
        <TableColumn>부제목</TableColumn>
        <TableColumn>작성일</TableColumn>
        <TableColumn>수정일</TableColumn>
        <TableColumn>작업</TableColumn>
      </TableHeader>
      <TableBody>
        {props.markdowns.map((markdown) => (
          <TableRow key={markdown.id}>
            <TableCell>{markdown.category}</TableCell>
            <TableCell>{markdown.title}</TableCell>
            <TableCell>{markdown.subtitle}</TableCell>
            <TableCell>{toDateTimeString(markdown.createdAt)}</TableCell>
            <TableCell>{toDateTimeString(markdown.updatedAt)}</TableCell>
            <TableCell>
              <Button
                as={Link}
                size="sm"
                href={Links.adminMarkdownEdit(markdown.id)}
              >
                수정
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

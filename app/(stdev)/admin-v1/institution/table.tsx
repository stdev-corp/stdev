'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/table'
import { Institution } from '@prisma/client'
import Link from 'next/link'

type Props = {
  institutions: Institution[]
}

export default function InstitutionTable(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>ID</TableColumn>
        <TableColumn>기관명</TableColumn>
        <TableColumn>로고 이미지 URL</TableColumn>
      </TableHeader>
      <TableBody>
        {props.institutions.map((institution) => (
          <TableRow key={institution.id}>
            <TableCell>{institution.id}</TableCell>
            <TableCell>{institution.name}</TableCell>
            <TableCell>
              <Link href={institution.imageUrl} target="_blank">
                {institution.imageUrl}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

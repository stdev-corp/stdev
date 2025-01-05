'use client'
import DeleteModal from '@/components/delete-modal'
import { toDateTimeString } from '@/utils/datetime'
import { Links } from '@/utils/links'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/table'
import { Redirect, User } from '@prisma/client'

type CustomRedirect = Pick<
  Redirect,
  'id' | 'slug' | 'url' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  user: Pick<User, 'name' | 'email'>
}

type Props = {
  redirects: CustomRedirect[]
}

export default function RedirectTable(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>단축 URL</TableColumn>
        <TableColumn>원본 URL</TableColumn>
        <TableColumn>생성일</TableColumn>
        <TableColumn>수정일</TableColumn>
        <TableColumn>삭제일</TableColumn>
        <TableColumn>생성자</TableColumn>
        <TableColumn>작업</TableColumn>
      </TableHeader>
      <TableBody>
        {props.redirects.map((redirect) => (
          <TableRow key={redirect.id}>
            <TableCell>{redirect.slug}</TableCell>
            <TableCell>{redirect.url}</TableCell>
            <TableCell>{toDateTimeString(redirect.createdAt)}</TableCell>
            <TableCell>{toDateTimeString(redirect.updatedAt)}</TableCell>
            <TableCell>{toDateTimeString(redirect.deletedAt)}</TableCell>
            <TableCell>
              {redirect.user.name} ({redirect.user.email})
            </TableCell>
            <TableCell>
              <DeleteModal
                id={redirect.id}
                model="redirect"
                redirectPath={Links.adminRedirect}
              >
                <div>단축 URL: https://stdev.kr/{redirect.slug}</div>
                <div>원본 URL: {redirect.url}</div>
              </DeleteModal>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

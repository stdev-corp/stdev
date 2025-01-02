'use client'

import { toDateTimeString } from '@/utils/datetime'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/table'
import { User } from '@prisma/client'

type Props = {
  users: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>[]
}

export default function UsersTable(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>ID</TableColumn>
        <TableColumn>이메일</TableColumn>
        <TableColumn>이름</TableColumn>
        <TableColumn>생성일</TableColumn>
        <TableColumn>수정일</TableColumn>
      </TableHeader>
      <TableBody>
        {props.users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.id}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.name}</TableCell>
            <TableCell>{toDateTimeString(user.createdAt)}</TableCell>
            <TableCell>{toDateTimeString(user.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

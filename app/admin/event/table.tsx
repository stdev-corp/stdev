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
import { Event } from '@prisma/client'

type Props = {
  events: Event[]
}

export default function EventTable(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>행사 ID</TableColumn>
        <TableColumn>행사 제목</TableColumn>
        <TableColumn>행사 날짜</TableColumn>
        <TableColumn>행사 장소</TableColumn>
      </TableHeader>
      <TableBody>
        {props.events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>{event.slug}</TableCell>
            <TableCell>{event.title}</TableCell>
            <TableCell>{`${toDateString(event.startDate)} ~ ${toDateString(event.endDate)}`}</TableCell>
            <TableCell>{event.location}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

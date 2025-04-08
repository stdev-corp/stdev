import { Links } from '@/utils/links'
import { queryEvents } from '@/utils/server/event'
import { Button } from '@heroui/button'
import Link from 'next/link'
import EventTable from './table'

export default async function AdminEventPage() {
  const events = await queryEvents()

  return (
    <>
      <h1>행사</h1>
      <Button href={Links.adminEventCreate} as={Link}>
        새 행사 생성
      </Button>
      <div className="h-8" />
      <EventTable events={events} />
    </>
  )
}

import { Links } from '@/utils/links'
import { queryRecords } from '@/utils/server/records'
import { Button } from '@nextui-org/button'
import Link from 'next/link'
import RecordTable from './table'

export default async function AdminRecordPage() {
  const records = await queryRecords()

  return (
    <>
      <h1>회의록 & 보고서</h1>
      <Button as={Link} href={Links.adminRecordCreate}>
        새 회의록 만들기
      </Button>
      <div className="h-4" />
      <RecordTable records={records} />
    </>
  )
}

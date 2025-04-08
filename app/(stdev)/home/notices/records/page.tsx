import RecordList from '@/components/record-list'
import { queryRecords } from '@/utils/server/records'

export default async function RecordsPage() {
  const records = await queryRecords()

  return (
    <div>
      <h1>총회 및 이사회</h1>
      <RecordList records={records} />
    </div>
  )
}

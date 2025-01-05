import RecordList from '@/components/record-list'
import { queryRecords } from '@/utils/server/records'

export default async function RecordsPage() {
  const records = await queryRecords()

  return (
    <div>
      <h1>회의록</h1>
      <RecordList records={records} />
    </div>
  )
}

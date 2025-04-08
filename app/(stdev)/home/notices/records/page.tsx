import RecordList from '@/components/record-list'
import { queryReports } from '@/utils/payload'

export default async function RecordsPage() {
  const reports = await queryReports('meeting')

  return (
    <div>
      <h1>총회 및 이사회</h1>
      <RecordList reports={reports} />
    </div>
  )
}

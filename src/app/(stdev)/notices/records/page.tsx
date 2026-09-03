import PageTitle from '@/components/krds/page-title'
import RecordList from '@/components/record-list'
import { queryReports } from '@/utils/cms'

export default async function RecordsPage() {
  const reports = await queryReports('meeting')

  return (
    <>
      <PageTitle title="총회 및 이사회" />
      <div className="conts-area">
        <div className="g-conts-area">
          <RecordList reports={reports} />
        </div>
      </div>
    </>
  )
}

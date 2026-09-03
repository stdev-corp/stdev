import PageTitle from '@/components/krds/page-title'
import RecordList from '@/components/record-list'
import { queryReports } from '@/utils/cms'

export default async function DonationPage() {
  const reports = await queryReports('donation')

  return (
    <>
      <PageTitle title="연간 기부금 모금액 및 활용실적" />
      <div className="conts-area">
        <div className="g-conts-area">
          <RecordList reports={reports} />
        </div>
      </div>
    </>
  )
}

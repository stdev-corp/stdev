import RecordList from '@/components/record-list'
import { queryReports } from '@/utils/cms'
import { Heading } from '@chakra-ui/react'

export default async function DonationPage() {
  const reports = await queryReports('donation')

  return (
    <div>
      <Heading>연간 기부금 모금액 및 활용실적</Heading>
      <RecordList reports={reports} />
    </div>
  )
}

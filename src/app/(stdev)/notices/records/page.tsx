import RecordList from '@/components/record-list'
import { queryReports } from '@/utils/payload'
import { Box, Heading } from '@chakra-ui/react'

export default async function RecordsPage() {
  const reports = await queryReports('meeting')

  return (
    <div>
      <Heading>총회 및 이사회</Heading>
      <Box h={4} />
      <RecordList reports={reports} />
    </div>
  )
}

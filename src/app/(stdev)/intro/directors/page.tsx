import { Box, Heading } from '@chakra-ui/react'
import DirectorsTable from './table'

export default async function DirectorsPage() {
  return (
    <>
      <Heading as="h1" size="xl" mb={8}>
        리더십
      </Heading>
      <Heading as="h2" size="lg" mb={4}>
        이사회
      </Heading>
      <p>
        사단법인 에스티데브 이사회는 정관 제9조에 따라 5인 이상 15인 이하로
        구성됩니다. 이사회는 이사장 1인, 상임이사 1인을 포함하여, 총 5인으로
        구성되어 있습니다. (2025년 1월 기준)
      </p>
      <Box h="2rem" />
      <DirectorsTable />
    </>
  )
}

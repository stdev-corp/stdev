import MarkdownView from '@/components/markdown/markdown-view'
import { Box, Heading, Text } from '@chakra-ui/react'
import { getLatestMarkdownByType } from '@/utils/cms'
import { toDateString } from '@/utils/datetime'

export default async function TermsPage() {
  const terms = await getLatestMarkdownByType('terms')

  if (!terms) {
    return (
      <Box maxW="6xl" mx="auto">
        <Heading>이용약관</Heading>
        <Box h="2rem" />
        <Text>이용약관이 등록되지 않았습니다.</Text>
      </Box>
    )
  }

  return (
    <Box maxW="6xl" mx="auto">
      <Heading>사단법인 에스티데브 이용약관</Heading>
      <Box h="1rem" />
      <Text color="gray.500" fontSize="sm">
        제정/개정일: {toDateString(terms.revisionDate)} | 시행일:{' '}
        {toDateString(terms.effectiveDate)}
      </Text>
      <Box h="2rem" />
      <MarkdownView content={terms.content} />
    </Box>
  )
}

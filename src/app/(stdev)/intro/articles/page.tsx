import { Box, Heading, Text } from '@chakra-ui/react'
import { getLatestMarkdownByType } from '@/utils/payload'
import MarkdownView from '@/components/markdown/markdown-view'
import dayjs from 'dayjs'

export default async function ArticlesPage() {
  const article = await getLatestMarkdownByType('articles')

  if (!article) {
    return (
      <Box>
        <Heading>정관</Heading>
        <Box h="2rem" />
        <Text>정관이 등록되지 않았습니다.</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Heading>사단법인 에스티데브 정관</Heading>
      <Box h="1rem" />
      <Text color="gray.500" fontSize="sm">
        제정/개정일: {dayjs(article.revisionDate).format('YYYY년 M월 D일')} |
        시행일: {dayjs(article.effectiveDate).format('YYYY년 M월 D일')}
      </Text>
      <Box h="2rem" />
      <MarkdownView content={article.content} />
    </Box>
  )
}

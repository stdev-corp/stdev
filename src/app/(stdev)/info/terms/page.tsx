import MarkdownView from '@/components/markdown/markdown-view'
import { Box } from '@chakra-ui/react'

export default async function TermsPage() {
  return (
    <Box maxW="4xl" mx="auto">
      <MarkdownView title="사단법인 에스티데브 이용약관" />
    </Box>
  )
}

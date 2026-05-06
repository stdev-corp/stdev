import { queryInstitutions } from '@/utils/cms'
import NextImage from 'next/image'
import Navigation from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import ScrollingLogos from '@/components/scrolling-logos'
import { Box, Heading } from '@chakra-ui/react'

export default async function Page() {
  const institutions = await queryInstitutions()

  return (
    <Box display="flex" flexDirection="column" minH="100vh">
      <Navigation />
      <Box flex="1">
        <Box maxW="5xl" mx="auto" p={4}>
          <Box h="120px" />
          <NextImage
            src="/images/intro/title.png"
            alt="title"
            width={4960}
            height={844}
            sizes="(max-width: 672px) calc(100vw - 32px), 600px"
            loading="eager"
            fetchPriority="high"
            style={{ width: '100%', maxWidth: '600px', height: 'auto' }}
          />
          <Box h="120px" />
          <NextImage
            src="/images/intro/3w1h.png"
            alt="3w1h"
            width={6672}
            height={3160}
            sizes="(max-width: 832px) calc(100vw - 32px), 800px"
            loading="eager"
            style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
          />
          <Box h="120px" />
          <Box py={12}>
            <Heading
              as="h2"
              size="lg"
              textAlign="center"
              color="gray.800"
              mb={10}
            >
              함께하는 기관
            </Heading>
            <ScrollingLogos institutions={institutions} />
          </Box>
          <Box h="120px" />
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

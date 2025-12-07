import { queryInstitutions } from '@/utils/payload'
import NextImage from 'next/image'
import Navigation from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Box, Container, Flex, Heading, SimpleGrid } from '@chakra-ui/react'

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
            width={600}
            height={600}
          />
          <Box h="120px" />
          <NextImage
            src="/images/intro/3w1h.png"
            alt="3w1h"
            width={800}
            height={800}
          />
          <Box h="120px" />
          <Box bg="gray.100" py={12}>
            <Container maxW="6xl" px={{ base: 6, lg: 16 }}>
              <Heading
                as="h2"
                size="lg"
                textAlign="center"
                color="gray.800"
                mb={10}
              >
                함께하는 기관
              </Heading>
              <SimpleGrid columns={{ base: 3, md: 4, lg: 6 }} gap={6}>
                {institutions.map((institution, index) => (
                  <Flex key={index} align="center" justify="center">
                    <NextImage
                      src={institution.imageUrl || ''}
                      alt={`Logo ${index + 1}`}
                      width={120}
                      height={60}
                      style={{ objectFit: 'contain' }}
                    />
                  </Flex>
                ))}
              </SimpleGrid>
            </Container>
          </Box>
          <Box h="120px" />
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

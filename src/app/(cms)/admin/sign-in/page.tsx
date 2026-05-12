import { Box, Card, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import SignInForm from './sign-in-form'

export default function SignInPage() {
  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" p={4}>
      <Card.Root maxW="md" w="full" shadow="md">
        <Card.Body>
          <Stack gap={5}>
            <Box>
              <Heading size="lg">STDev CMS 로그인</Heading>
              <Text color="gray.600" mt={2}>
                STDev Google 계정으로 로그인하세요.
              </Text>
            </Box>
            <SignInForm />
            <Text fontSize="xs" color="gray.500">
              관리자는 Google로 연결된 @stdev.kr 계정만 접근할 수 있습니다.
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Flex>
  )
}

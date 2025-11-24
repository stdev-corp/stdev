import { Box, Heading, Stack } from '@chakra-ui/react'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function WithLine(props: Props) {
  return (
    <Stack direction="row" align="stretch" gap={2} mt={8} mb={4}>
      <Box bg="teal.600" w="4px" borderRadius="full" my={1} />
      <Heading as="h2" size="md" m={0}>
        {props.children}
      </Heading>
    </Stack>
  )
}

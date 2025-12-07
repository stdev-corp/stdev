'use client'
import { Links } from '@/utils/links'
import Link from 'next/link'
import { ReactNode } from 'react'
import { Box, Button, Heading, Separator, Stack } from '@chakra-ui/react'

type Props = {
  title: string
  children: ReactNode
}

export default function CenterScreen(props: Props) {
  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        maxW="lg"
        w="full"
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        boxShadow="md"
        bg="white"
      >
        <Stack gap={3}>
          <Heading size="lg">{props.title}</Heading>
          <Separator />
          <Box>{props.children}</Box>
          <Separator />
          <Button
            asChild
            bg="teal.500"
            _hover={{ bg: 'teal.600' }}
            color="white"
          >
            <Link href={Links.root}>홈페이지로 돌아가기</Link>
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}

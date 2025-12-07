'use client'
import { Box, Button, Separator, Stack, Text, Flex } from '@chakra-ui/react'
import Link from 'next/link'

type Props = {
  reports: {
    id: number
    title: string
    publishedDate: string
    file_url: string
  }[]
}

export default function RecordList(props: Props) {
  if (props.reports.length === 0) {
    return (
      <Stack gap={4}>
        <Separator />
        <Text minH="3rem" display="flex" alignItems="center">
          자료가 존재하지 않습니다.
        </Text>
        <Separator />
      </Stack>
    )
  }

  return (
    <Stack gap={0}>
      <Separator />
      {props.reports.map((record) => (
        <Box key={record.id}>
          <Flex minH="3rem" gap={4} align="center">
            <Text flex="1">{record.title}</Text>
            <Text>{record.publishedDate}</Text>
            <Button variant="outline" asChild size="sm">
              <Link
                href={record.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                PDF
              </Link>
            </Button>
          </Flex>
          <Separator />
        </Box>
      ))}
    </Stack>
  )
}

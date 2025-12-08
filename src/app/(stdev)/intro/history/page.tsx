import { Box, Timeline, Text, Heading } from '@chakra-ui/react'
import Image from 'next/image'
import { queryHistories } from '@/utils/payload'
import dayjs from 'dayjs'

export default async function HistoryPage() {
  const histories = await queryHistories()

  return (
    <>
      <Heading>연혁</Heading>
      <Box h="2rem" />
      <Timeline.Root size="lg">
        {histories.map((history) => (
          <Timeline.Item key={history.id}>
            <Timeline.Connector>
              <Timeline.Separator />
              <Timeline.Indicator />
            </Timeline.Connector>
            <Timeline.Content pb="8">
              <Timeline.Title>
                <Text fontWeight="bold" fontSize="lg">
                  {history.title}
                </Text>
              </Timeline.Title>
              <Timeline.Description>
                <Text color="gray.500" fontSize="sm">
                  {dayjs(history.date).format('YYYY년 M월 D일')}
                </Text>
              </Timeline.Description>
              {history.content && (
                <Text mt="2" color="gray.600" whiteSpace="pre-line">
                  {history.content}
                </Text>
              )}
              {history.imageUrl && (
                <Box mt="4">
                  <Image
                    src={history.imageUrl}
                    alt={history.imageAlt || history.title}
                    width={400}
                    height={300}
                    style={{ borderRadius: '8px', objectFit: 'cover' }}
                  />
                </Box>
              )}
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline.Root>
    </>
  )
}

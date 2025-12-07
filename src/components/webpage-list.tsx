'use client'

import { Webpage } from '@/generated/payload-types'
import { Separator, Stack, Text, Flex } from '@chakra-ui/react'
import Link from 'next/link'

type WebpageWithBusiness = Pick<
  Webpage,
  'id' | 'title' | 'author' | 'url' | 'publishedDate'
> & {
  business_name: string
}

type Props = {
  webpages: WebpageWithBusiness[]
}

export default function WebpageList(props: Props) {
  if (props.webpages.length === 0) {
    return (
      <Stack gap={4}>
        <Separator />
        <Text w="full" py={4}>
          자료가 존재하지 않습니다.
        </Text>
        <Separator />
      </Stack>
    )
  }

  return (
    <Stack gap={0}>
      <Separator />
      {props.webpages.map((webpage) => (
        <Link key={webpage.id} href={webpage.url} target="_blank">
          <Stack gap={2} py={4} w="full">
            <Text fontWeight="bold">{webpage.title}</Text>
            <Flex gap={4} align="center">
              <Text>{webpage.author}</Text>
              <Text>{webpage.publishedDate}</Text>
              <Flex flex="1" />
              <Text>{webpage.business_name}</Text>
            </Flex>
            <Separator />
          </Stack>
        </Link>
      ))}
    </Stack>
  )
}

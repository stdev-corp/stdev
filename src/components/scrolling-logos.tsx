'use client'

import NextImage from 'next/image'
import { Box, Flex } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

const scrollAnimation = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`

type Institution = {
  imageUrl?: string | null | undefined
}

type Props = {
  institutions: Institution[]
}

export default function ScrollingLogos({ institutions }: Props) {
  return (
    <Box overflow="hidden" width="100%">
      <Flex
        gap={12}
        animation={`${scrollAnimation} 30s linear infinite`}
        width="max-content"
        _hover={{ animationPlayState: 'paused' }}
      >
        {/* Duplicate institutions array for seamless infinite scroll */}
        {[...institutions, ...institutions].map((institution, index) => (
          <Flex key={index} align="center" justify="center" flexShrink={0}>
            <NextImage
              src={institution.imageUrl || ''}
              alt={`Logo ${(index % institutions.length) + 1}`}
              width={180}
              height={90}
              style={{ objectFit: 'contain' }}
            />
          </Flex>
        ))}
      </Flex>
    </Box>
  )
}

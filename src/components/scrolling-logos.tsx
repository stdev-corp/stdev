'use client'

import type { InstitutionLogo } from '@/utils/cms-types'
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

type Props = {
  institutions: InstitutionLogo[]
}

export default function ScrollingLogos({ institutions }: Props) {
  if (institutions.length === 0) {
    return null
  }

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
          <Box
            key={index}
            position="relative"
            width="180px"
            height="90px"
            flexShrink={0}
          >
            <NextImage
              src={institution.imageUrl || '/images/intro/title.png'}
              alt={institution.imageAlt || `Logo ${(index % institutions.length) + 1}`}
              fill
              sizes="180px"
              style={{ objectFit: 'contain' }}
            />
          </Box>
        ))}
      </Flex>
    </Box>
  )
}

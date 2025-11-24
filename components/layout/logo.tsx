import { Box } from '@chakra-ui/react'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  src: string
  url: string
}

export default function Logo(props: Props) {
  return (
    <Link href={props.url} passHref target="_blank">
      <Box bg="white" h="3rem" w="14rem" position="relative">
        <Image
          src={props.src}
          alt="logo"
          fill
          style={{
            objectFit: 'contain',
            objectPosition: 'left center',
          }}
        />
      </Box>
    </Link>
  )
}

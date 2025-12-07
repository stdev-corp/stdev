import { Box } from '@chakra-ui/react'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function BasicLayout(props: Props) {
  return (
    <Box position="relative" maxW="5xl" mx="auto" px={8} py={12}>
      {props.children}
    </Box>
  )
}

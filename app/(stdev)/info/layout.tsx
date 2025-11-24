import { ReactNode } from 'react'
import Navigation from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Box } from '@chakra-ui/react'

type Props = {
  children: ReactNode
}

export default async function Layout(props: Props) {
  return (
    <Box display="flex" flexDirection="column" minH="100vh">
      <Navigation />
      <Box flex="1" py={8} px={8}>
        {props.children}
      </Box>
      <Footer />
    </Box>
  )
}

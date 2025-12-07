import LeftMenuLayout from '@/components/layout/left-menu-layout'
import Navigation from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { NoticesMenu } from '@/utils/menus'
import { ReactNode } from 'react'
import { Box } from '@chakra-ui/react'

type Props = {
  children: ReactNode
}

export default function NoticesLayout(props: Props) {
  return (
    <Box display="flex" flexDirection="column" minH="100vh">
      <Navigation />
      <Box flex="1">
        <LeftMenuLayout menu={NoticesMenu}>{props.children}</LeftMenuLayout>
      </Box>
      <Footer />
    </Box>
  )
}

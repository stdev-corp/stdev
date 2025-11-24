import LeftMenu from '@/components/layout/left-menu'
import { Menu } from '@/utils/menus'
import { ReactNode } from 'react'
import SubMenuSelect from '@/components/layout/sub-menu-select'
import BasicLayout from '@/components/layout/basic-layout'
import { Box } from '@chakra-ui/react'

type Props = {
  menu: Menu
  children: ReactNode
}

export default function LeftMenuLayout(props: Props) {
  return (
    <>
      <Box
        position="fixed"
        top="7rem"
        left="3rem"
        display={{ base: 'none', sm: 'block' }}
      >
        <LeftMenu menu={props.menu} />
      </Box>
      <Box display={{ base: 'block', sm: 'none' }}>
        <SubMenuSelect menu={props.menu} />
      </Box>
      <BasicLayout>{props.children}</BasicLayout>
    </>
  )
}

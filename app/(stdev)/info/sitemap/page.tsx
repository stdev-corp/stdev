import {
  BusinessMenu,
  InfoMenu,
  IntroMenu,
  Menu,
  NoticesMenu,
  OtherMenu,
} from '@/utils/menus'
import Link from 'next/link'
import { Box, Heading, Link as ChakraLink, Stack, Text } from '@chakra-ui/react'

type SitemapMenuProps = {
  menu: Menu
}

function SitemapMenu(props: SitemapMenuProps) {
  return (
    <Box>
      <ChakraLink as={Link} href={props.menu.href}>
        <Heading as="h2" size="md" mb={4}>
          {props.menu.label}
        </Heading>
      </ChakraLink>
      <Stack as="ul" gap={3} listStyleType="none" m={0} p={0}>
        {props.menu.subMenus?.map((child) => (
          <Box as="li" key={child.href}>
            <ChakraLink as={Link} href={child.href}>
              <Text fontSize="lg">{child.label}</Text>
            </ChakraLink>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export default async function Sitemap() {
  return (
    <Box maxW="6xl" mx="auto" px={4}>
      <Heading as="h1" size="xl" mb={6}>
        사이트맵
      </Heading>
      <Stack direction={{ base: 'column', md: 'row' }} gap={12}>
        <SitemapMenu menu={IntroMenu} />
        <SitemapMenu menu={BusinessMenu} />
        <SitemapMenu menu={NoticesMenu} />
        <SitemapMenu menu={InfoMenu} />
        <SitemapMenu menu={OtherMenu} />
      </Stack>
    </Box>
  )
}

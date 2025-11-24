import dayjs from 'dayjs'
import Logo from '@/components/layout/logo'
import { Links } from '@/utils/links'
import SnsLink, {
  GithubLogo,
  HomepageLogo,
  InstagramLogo,
  LinkedinLogo,
  YoutubeLogo,
} from '@/components/layout/sns-link'
import {
  Box,
  Container,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'

export default function Footer() {
  return (
    <Box as="footer" bg="gray.800" color="white" py={8}>
      <Container maxW="6xl">
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 2, lg: 8 }}
          justify="center"
          align="center"
        >
          <SnsLink
            logo={<HomepageLogo />}
            handle="stdev.kr"
            url="https://stdev.kr"
          />
          <SnsLink
            logo={<InstagramLogo />}
            handle="@stdev.corp"
            url="https://instagram.com/stdev.corp"
          />
          <SnsLink
            logo={<LinkedinLogo />}
            handle="@stdev-corp"
            url="https://www.linkedin.com/company/stdev-corp"
          />
          <SnsLink
            logo={<GithubLogo />}
            handle="@stdev-corp"
            url="https://github.com/stdev-corp"
          />
          <SnsLink
            logo={<YoutubeLogo />}
            handle="@stdev-corp"
            url="https://www.youtube.com/@stdev-corp"
          />
        </Stack>
        <Box mt={8}>
          <Flex wrap="wrap" justify="space-between" gap={6}>
            <Box>
              <Heading size="md" mb={2}>
                STDev
              </Heading>
              <Text fontSize="sm" lineHeight="tall">
                상호명: 사단법인 에스티데브 (STDev Nonprofit Corporation)
                <br />
                사업자등록번호: 169-82-00606
                <br />
                통신판매업신고번호: 2025-대전서구-0117
                <br />
                대표자: 한우영
                <br />
                주소: 대전광역시 서구 월평로 65, 802호 (월평동, 용원빌딩)
                <br />
                전화: 0507-1441-9392
              </Text>
            </Box>
            <Box>
              <Heading size="md" mb={2}>
                안내 및 공시
              </Heading>
              <Stack align="start" gap={2} fontSize="sm">
                <Link href={Links.infoPrivacy} color="white">
                  개인정보처리방침
                </Link>
                <Link href={Links.infoTerms} color="white">
                  이용약관
                </Link>
                <Link href={Links.noticesDonation} color="white">
                  연간 기부금 모금액 및 활용실적
                </Link>
                <Link href={Links.infoSitemap} color="white">
                  사이트맵
                </Link>
              </Stack>
            </Box>
            <Stack align="start" gap={4} direction="column">
              <Logo src="/images/gov/msit-logo.png" url={Links.msit} />
              <Logo src="/images/gov/nts-logo.png" url={Links.nts} />
              <Logo src="/images/gov/acrc-logo.png" url={Links.acrc} />
            </Stack>
          </Flex>
          <Text mt={8} textAlign="center" fontSize="sm">
            © {dayjs().year()} STDev Nonprofit Corporation. All rights
            reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  )
}

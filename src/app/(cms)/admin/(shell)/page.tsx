import Link from 'next/link'
import { Box, Heading, SimpleGrid, Stack, Stat, Text } from '@chakra-ui/react'
import { prisma } from '@/utils/prisma'

type StatCardProps = {
  label: string
  value: number
  href: string
}

function StatCard({ label, value, href }: StatCardProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <Box
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        p={5}
        transition="all 0.15s"
        _hover={{ borderColor: 'teal.400', shadow: 'sm' }}
      >
        <Stat.Root>
          <Stat.Label color="gray.600">{label}</Stat.Label>
          <Stat.ValueText fontSize="3xl">{value}</Stat.ValueText>
        </Stat.Root>
      </Box>
    </Link>
  )
}

export default async function AdminDashboardPage() {
  const [
    businesses,
    images,
    files,
    institutions,
    markdowns,
    webpages,
    reports,
    histories,
    settings,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.imageAsset.count(),
    prisma.fileAsset.count(),
    prisma.institution.count(),
    prisma.markdown.count(),
    prisma.webpage.count(),
    prisma.report.count(),
    prisma.history.count(),
    prisma.adminSettings.count(),
  ])

  return (
    <Stack gap={6}>
      <Box>
        <Heading size="lg">대시보드</Heading>
        <Text color="gray.600" mt={1}>
          STDev DIY CMS의 현재 데이터 현황입니다.
        </Text>
      </Box>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
        <StatCard label="사업" value={businesses} href="/admin/businesses" />
        <StatCard label="이미지" value={images} href="/admin/images" />
        <StatCard label="파일" value={files} href="/admin/files" />
        <StatCard
          label="기관"
          value={institutions}
          href="/admin/institutions"
        />
        <StatCard label="마크다운" value={markdowns} href="/admin/markdowns" />
        <StatCard label="웹페이지" value={webpages} href="/admin/webpages" />
        <StatCard label="보고서" value={reports} href="/admin/reports" />
        <StatCard label="연혁" value={histories} href="/admin/histories" />
        <StatCard label="설정" value={settings} href="/admin/settings" />
      </SimpleGrid>
    </Stack>
  )
}

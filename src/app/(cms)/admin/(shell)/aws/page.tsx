import Link from 'next/link'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Heading,
  SimpleGrid,
  Stack,
  Stat,
  Table,
  Text,
} from '@chakra-ui/react'
import { getAwsCredentials } from '@/utils/admin-settings'
import { loadAwsDashboardData, type AwsDashboardData } from '@/utils/aws'

function formatAmount(amount: number | undefined, currency: string) {
  if (amount === undefined) {
    return '-'
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

function sum(values: Record<string, number>) {
  return Object.values(values).reduce((acc, value) => acc + value, 0)
}

function MissingCredentials() {
  return (
    <Stack gap={6}>
      <Box>
        <Heading size="lg">AWS 비용</Heading>
        <Text color="gray.600" mt={1}>
          AWS Organizations와 Cost Explorer 정보를 표시합니다.
        </Text>
      </Box>
      <Alert.Root status="warning">
        <Alert.Indicator />
        <Stack gap={2} flex="1">
          <Alert.Title>AWS 자격 증명이 설정되지 않았습니다.</Alert.Title>
          <Alert.Description>
            설정 페이지에서 <code>AWS_ACCESS_KEY_ID</code>와{' '}
            <code>AWS_SECRET_ACCESS_KEY</code> 키-값을 추가해주세요.
          </Alert.Description>
          <Box>
            <Button asChild size="sm" colorPalette="teal">
              <Link href="/admin/settings">설정으로 이동</Link>
            </Button>
          </Box>
        </Stack>
      </Alert.Root>
    </Stack>
  )
}

function FailureBanner({ message }: { message: string }) {
  return (
    <Stack gap={6}>
      <Box>
        <Heading size="lg">AWS 비용</Heading>
        <Text color="gray.600" mt={1}>
          AWS Organizations와 Cost Explorer 정보를 표시합니다.
        </Text>
      </Box>
      <Alert.Root status="error">
        <Alert.Indicator />
        <Stack gap={2} flex="1">
          <Alert.Title>AWS API 호출에 실패했습니다.</Alert.Title>
          <Alert.Description>{message}</Alert.Description>
        </Stack>
      </Alert.Root>
    </Stack>
  )
}

function Dashboard({ data }: { data: AwsDashboardData }) {
  const { organization, accounts, costs } = data
  const masterId = organization?.MasterAccountId
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.Id === masterId) return -1
    if (b.Id === masterId) return 1
    return (a.Name ?? '').localeCompare(b.Name ?? '')
  })

  return (
    <Stack gap={6}>
      <Box>
        <Heading size="lg">AWS 비용</Heading>
        <Text color="gray.600" mt={1}>
          현재 자격 증명으로 연결된 Organization과 각 Account의 당월/전월 비용을
          표시합니다.
        </Text>
      </Box>

      <Card.Root>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Stat.Root>
              <Stat.Label>Organization ID</Stat.Label>
              <Stat.ValueText fontSize="md">
                {organization?.Id ?? '연결된 Organization 없음'}
              </Stat.ValueText>
            </Stat.Root>
            <Stat.Root>
              <Stat.Label>메인(관리) 계정</Stat.Label>
              <Stat.ValueText fontSize="md">{masterId ?? '-'}</Stat.ValueText>
              <Stat.HelpText>
                {organization?.MasterAccountEmail ?? ''}
              </Stat.HelpText>
            </Stat.Root>
            <Stat.Root>
              <Stat.Label>총 계정 수</Stat.Label>
              <Stat.ValueText>{accounts.length}</Stat.ValueText>
            </Stat.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Card.Root>
          <Card.Body>
            <Stat.Root>
              <Stat.Label>
                당월 합계 ({costs.currentMonth.start} ~ {costs.currentMonth.end}
                )
              </Stat.Label>
              <Stat.ValueText>
                {formatAmount(sum(costs.currentMonth.costs), costs.currency)}
              </Stat.ValueText>
            </Stat.Root>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Stat.Root>
              <Stat.Label>
                전월 합계 ({costs.previousMonth.start} ~{' '}
                {costs.previousMonth.end})
              </Stat.Label>
              <Stat.ValueText>
                {formatAmount(sum(costs.previousMonth.costs), costs.currency)}
              </Stat.ValueText>
            </Stat.Root>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Card.Root>
        <Card.Body>
          <Heading size="md" mb={3}>
            계정별 비용
          </Heading>
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Account ID</Table.ColumnHeader>
                  <Table.ColumnHeader>이름</Table.ColumnHeader>
                  <Table.ColumnHeader>이메일</Table.ColumnHeader>
                  <Table.ColumnHeader>상태</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">당월</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">전월</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedAccounts.map((account) => {
                  const id = account.Id ?? ''
                  const current = costs.currentMonth.costs[id]
                  const previous = costs.previousMonth.costs[id]
                  return (
                    <Table.Row key={id}>
                      <Table.Cell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Text fontFamily="mono">{id}</Text>
                          {id === masterId && (
                            <Badge colorPalette="teal" size="xs">
                              MAIN
                            </Badge>
                          )}
                        </Box>
                      </Table.Cell>
                      <Table.Cell>{account.Name ?? '-'}</Table.Cell>
                      <Table.Cell color="gray.600">
                        {account.Email ?? '-'}
                      </Table.Cell>
                      <Table.Cell>{account.Status ?? '-'}</Table.Cell>
                      <Table.Cell textAlign="end">
                        {formatAmount(current, costs.currency)}
                      </Table.Cell>
                      <Table.Cell textAlign="end" color="gray.600">
                        {formatAmount(previous, costs.currency)}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}

async function safeLoadAwsDashboardData(credentials: {
  accessKeyId: string
  secretAccessKey: string
}): Promise<
  { ok: true; data: AwsDashboardData } | { ok: false; message: string }
> {
  try {
    const data = await loadAwsDashboardData(credentials)
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

export default async function AwsDashboardPage() {
  const credentials = await getAwsCredentials()
  if (!credentials) {
    return <MissingCredentials />
  }

  const result = await safeLoadAwsDashboardData(credentials)
  if (!result.ok) {
    return <FailureBanner message={result.message} />
  }
  return <Dashboard data={result.data} />
}

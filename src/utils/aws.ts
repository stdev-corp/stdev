import dayjs from 'dayjs'
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer'
import {
  DescribeOrganizationCommand,
  ListAccountsCommand,
  OrganizationsClient,
  type Account,
  type Organization,
} from '@aws-sdk/client-organizations'

const AWS_REGION = 'us-east-1'

export type AwsCredentials = {
  accessKeyId: string
  secretAccessKey: string
}

export type MonthlyCosts = Record<string, number>

export type MonthRange = {
  start: string
  end: string
  costs: MonthlyCosts
}

export type AwsCostSummary = {
  currency: string
  currentMonth: MonthRange
  previousMonth: MonthRange
}

export type AwsDashboardData = {
  organization: Organization | null
  accounts: Account[]
  costs: AwsCostSummary
}

function makeOrgClient(credentials: AwsCredentials) {
  return new OrganizationsClient({ region: AWS_REGION, credentials })
}

function makeCostClient(credentials: AwsCredentials) {
  return new CostExplorerClient({ region: AWS_REGION, credentials })
}

export async function describeOrganization(credentials: AwsCredentials) {
  const client = makeOrgClient(credentials)
  const response = await client.send(new DescribeOrganizationCommand({}))
  return response.Organization ?? null
}

export async function listAllAccounts(credentials: AwsCredentials) {
  const client = makeOrgClient(credentials)
  const accounts: Account[] = []
  let nextToken: string | undefined

  do {
    const response = await client.send(
      new ListAccountsCommand({ NextToken: nextToken }),
    )
    if (response.Accounts) {
      accounts.push(...response.Accounts)
    }
    nextToken = response.NextToken
  } while (nextToken)

  return accounts
}

export function buildCostTimePeriod(now: dayjs.Dayjs = dayjs()) {
  const currentStart = now.startOf('month').format('YYYY-MM-DD')
  const previousStart = now
    .subtract(1, 'month')
    .startOf('month')
    .format('YYYY-MM-DD')
  const currentEnd = now.add(1, 'month').startOf('month').format('YYYY-MM-DD')

  return { previousStart, currentStart, currentEnd }
}

export async function getCurrentAndPreviousMonthCosts(
  credentials: AwsCredentials,
  now: dayjs.Dayjs = dayjs(),
): Promise<AwsCostSummary> {
  const client = makeCostClient(credentials)
  const { previousStart, currentStart, currentEnd } = buildCostTimePeriod(now)

  let currency = 'USD'
  const currentMonth: MonthRange = {
    start: currentStart,
    end: currentEnd,
    costs: {},
  }
  const previousMonth: MonthRange = {
    start: previousStart,
    end: currentStart,
    costs: {},
  }

  let nextPageToken: string | undefined
  do {
    const response = await client.send(
      new GetCostAndUsageCommand({
        TimePeriod: { Start: previousStart, End: currentEnd },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'LINKED_ACCOUNT' }],
        NextPageToken: nextPageToken,
      }),
    )

    for (const result of response.ResultsByTime ?? []) {
      const isCurrent = result.TimePeriod?.Start === currentStart
      const target = isCurrent ? currentMonth : previousMonth

      for (const group of result.Groups ?? []) {
        const accountId = group.Keys?.[0]
        const metric = group.Metrics?.UnblendedCost
        if (!accountId || !metric) continue
        target.costs[accountId] = Number(metric.Amount ?? '0')
        if (metric.Unit) {
          currency = metric.Unit
        }
      }
    }

    nextPageToken = response.NextPageToken
  } while (nextPageToken)

  return { currency, currentMonth, previousMonth }
}

export async function loadAwsDashboardData(
  credentials: AwsCredentials,
): Promise<AwsDashboardData> {
  const [organization, accounts, costs] = await Promise.all([
    describeOrganization(credentials),
    listAllAccounts(credentials),
    getCurrentAndPreviousMonthCosts(credentials),
  ])
  return { organization, accounts, costs }
}

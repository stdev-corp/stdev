import { beforeEach, describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { mockClient } from 'aws-sdk-client-mock'
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer'
import {
  DescribeOrganizationCommand,
  ListAccountsCommand,
  OrganizationsClient,
} from '@aws-sdk/client-organizations'

import * as awsModule from '@/utils/aws'
import {
  buildCostTimePeriod,
  describeOrganization,
  getCurrentAndPreviousMonthCosts,
  listAllAccounts,
  loadAwsDashboardData,
} from '@/utils/aws'

const credentials = { accessKeyId: 'AKIA', secretAccessKey: 'secret' }
const orgMock = mockClient(OrganizationsClient)
const costMock = mockClient(CostExplorerClient)

beforeEach(() => {
  orgMock.reset()
  costMock.reset()
})

describe('buildCostTimePeriod', () => {
  it('returns ISO YYYY-MM-DD strings for previous, current, next month boundaries', () => {
    const now = dayjs('2026-05-13T12:00:00.000Z')
    expect(buildCostTimePeriod(now)).toEqual({
      previousStart: '2026-04-01',
      currentStart: '2026-05-01',
      currentEnd: '2026-06-01',
    })
  })

  it('handles January correctly (previous month is December of prior year)', () => {
    const now = dayjs('2026-01-15T00:00:00.000Z')
    expect(buildCostTimePeriod(now)).toEqual({
      previousStart: '2025-12-01',
      currentStart: '2026-01-01',
      currentEnd: '2026-02-01',
    })
  })
})

describe('describeOrganization', () => {
  it('returns the Organization from the SDK response', async () => {
    orgMock.on(DescribeOrganizationCommand).resolves({
      Organization: { Id: 'o-1', MasterAccountId: '123' },
    })
    const org = await describeOrganization(credentials)
    expect(org).toEqual({ Id: 'o-1', MasterAccountId: '123' })
  })

  it('returns null when no Organization is present', async () => {
    orgMock.on(DescribeOrganizationCommand).resolves({})
    const org = await describeOrganization(credentials)
    expect(org).toBeNull()
  })
})

describe('listAllAccounts', () => {
  it('collects accounts across pages until NextToken is undefined', async () => {
    orgMock.on(ListAccountsCommand, { NextToken: undefined }).resolvesOnce({
      Accounts: [{ Id: '1', Name: 'A' }],
      NextToken: 'page2',
    })
    orgMock
      .on(ListAccountsCommand, { NextToken: 'page2' })
      .resolvesOnce({ Accounts: [{ Id: '2', Name: 'B' }] })

    const accounts = await listAllAccounts(credentials)
    expect(accounts).toEqual([
      { Id: '1', Name: 'A' },
      { Id: '2', Name: 'B' },
    ])
  })

  it('returns empty array when API returns no Accounts field', async () => {
    orgMock.on(ListAccountsCommand).resolves({})
    const accounts = await listAllAccounts(credentials)
    expect(accounts).toEqual([])
  })
})

describe('getCurrentAndPreviousMonthCosts', () => {
  it('groups costs into current and previous month buckets keyed by account', async () => {
    const now = dayjs('2026-05-13T00:00:00.000Z')
    costMock.on(GetCostAndUsageCommand).resolves({
      ResultsByTime: [
        {
          TimePeriod: { Start: '2026-04-01', End: '2026-05-01' },
          Groups: [
            {
              Keys: ['111'],
              Metrics: { UnblendedCost: { Amount: '10.5', Unit: 'USD' } },
            },
            {
              Keys: ['222'],
              Metrics: { UnblendedCost: { Amount: '4.2', Unit: 'USD' } },
            },
          ],
        },
        {
          TimePeriod: { Start: '2026-05-01', End: '2026-06-01' },
          Groups: [
            {
              Keys: ['111'],
              Metrics: { UnblendedCost: { Amount: '7', Unit: 'USD' } },
            },
          ],
        },
      ],
    })

    const summary = await getCurrentAndPreviousMonthCosts(credentials, now)
    expect(summary).toEqual({
      currency: 'USD',
      currentMonth: {
        start: '2026-05-01',
        end: '2026-06-01',
        costs: { '111': 7 },
      },
      previousMonth: {
        start: '2026-04-01',
        end: '2026-05-01',
        costs: { '111': 10.5, '222': 4.2 },
      },
    })
  })

  it('skips groups missing key or metrics', async () => {
    const now = dayjs('2026-05-13T00:00:00.000Z')
    costMock.on(GetCostAndUsageCommand).resolves({
      ResultsByTime: [
        {
          TimePeriod: { Start: '2026-05-01', End: '2026-06-01' },
          Groups: [
            { Keys: [], Metrics: { UnblendedCost: { Amount: '1' } } },
            { Keys: ['x'], Metrics: {} },
          ],
        },
      ],
    })

    const summary = await getCurrentAndPreviousMonthCosts(credentials, now)
    expect(summary.currentMonth.costs).toEqual({})
    expect(summary.previousMonth.costs).toEqual({})
  })

  it('falls back to defaults when ResultsByTime is missing', async () => {
    const now = dayjs('2026-05-13T00:00:00.000Z')
    costMock.on(GetCostAndUsageCommand).resolves({})
    const summary = await getCurrentAndPreviousMonthCosts(credentials, now)
    expect(summary.currency).toBe('USD')
    expect(summary.currentMonth.costs).toEqual({})
    expect(summary.previousMonth.costs).toEqual({})
  })

  it('paginates Cost Explorer responses via NextPageToken', async () => {
    const now = dayjs('2026-05-13T00:00:00.000Z')
    costMock
      .on(GetCostAndUsageCommand, { NextPageToken: undefined })
      .resolvesOnce({
        ResultsByTime: [
          {
            TimePeriod: { Start: '2026-05-01', End: '2026-06-01' },
            Groups: [
              {
                Keys: ['111'],
                Metrics: { UnblendedCost: { Amount: '3', Unit: 'USD' } },
              },
            ],
          },
        ],
        NextPageToken: 'page2',
      })
    costMock
      .on(GetCostAndUsageCommand, { NextPageToken: 'page2' })
      .resolvesOnce({
        ResultsByTime: [
          {
            TimePeriod: { Start: '2026-05-01', End: '2026-06-01' },
            Groups: [
              {
                Keys: ['222'],
                Metrics: { UnblendedCost: { Amount: '5', Unit: 'USD' } },
              },
            ],
          },
          {
            TimePeriod: { Start: '2026-04-01', End: '2026-05-01' },
            Groups: [
              {
                Keys: ['333'],
                Metrics: { UnblendedCost: { Amount: '8', Unit: 'USD' } },
              },
            ],
          },
        ],
      })

    const summary = await getCurrentAndPreviousMonthCosts(credentials, now)
    expect(summary.currentMonth.costs).toEqual({ '111': 3, '222': 5 })
    expect(summary.previousMonth.costs).toEqual({ '333': 8 })
  })
})

describe('loadAwsDashboardData', () => {
  it('aggregates organization, accounts, and cost summary', async () => {
    orgMock.on(DescribeOrganizationCommand).resolves({
      Organization: { Id: 'o-1', MasterAccountId: '999' },
    })
    orgMock.on(ListAccountsCommand).resolves({
      Accounts: [{ Id: '999', Name: 'main' }],
    })
    costMock.on(GetCostAndUsageCommand).resolves({ ResultsByTime: [] })

    const result = await loadAwsDashboardData(credentials)
    expect(result.organization).toEqual({ Id: 'o-1', MasterAccountId: '999' })
    expect(result.accounts).toEqual([{ Id: '999', Name: 'main' }])
    expect(result.costs.currency).toBe('USD')
  })
})

describe('aws module', () => {
  it('exports buildCostTimePeriod helper', () => {
    expect(typeof awsModule).toBe('object')
  })
})

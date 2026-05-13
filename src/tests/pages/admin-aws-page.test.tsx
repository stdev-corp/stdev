import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import AwsDashboardPage from '@/app/(cms)/admin/(shell)/aws/page'
import { getAwsCredentials } from '@/utils/admin-settings'
import { loadAwsDashboardData } from '@/utils/aws'

vi.mock('@/utils/admin-settings', () => ({
  getAwsCredentials: vi.fn(),
}))

vi.mock('@/utils/aws', () => ({
  loadAwsDashboardData: vi.fn(),
}))

const getAwsCredentialsMock = getAwsCredentials as unknown as ReturnType<
  typeof vi.fn
>
const loadAwsDashboardDataMock = loadAwsDashboardData as unknown as ReturnType<
  typeof vi.fn
>

describe('AwsDashboardPage', () => {
  beforeEach(() => {
    getAwsCredentialsMock.mockReset()
    loadAwsDashboardDataMock.mockReset()
  })

  it('renders missing credentials guidance', async () => {
    getAwsCredentialsMock.mockResolvedValue(null)

    await renderAsyncServerComponent(AwsDashboardPage)

    expect(
      screen.getByRole('heading', { name: 'AWS 비용' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('AWS 자격 증명이 설정되지 않았습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '설정으로 이동' })).toHaveAttribute(
      'href',
      '/admin/settings',
    )
  })

  it('renders API failure message when dashboard load fails', async () => {
    getAwsCredentialsMock.mockResolvedValue({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
    })
    loadAwsDashboardDataMock.mockRejectedValue(
      new Error('Cost Explorer denied'),
    )

    await renderAsyncServerComponent(AwsDashboardPage)

    expect(screen.getByText('AWS API 호출에 실패했습니다.')).toBeInTheDocument()
    expect(screen.getByText('Cost Explorer denied')).toBeInTheDocument()
  })

  it('renders organization, sorted accounts, and current/previous costs', async () => {
    getAwsCredentialsMock.mockResolvedValue({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
    })
    loadAwsDashboardDataMock.mockResolvedValue({
      organization: {
        Id: 'o-123',
        MasterAccountId: '222',
        MasterAccountEmail: 'main@example.com',
      },
      accounts: [
        {
          Id: '333',
          Name: 'Zeta',
          Email: 'zeta@example.com',
          Status: 'SUSPENDED',
        },
        {
          Id: '222',
          Name: 'Main',
          Email: 'main@example.com',
          State: 'ACTIVE',
          Status: 'PENDING_CLOSURE',
        },
      ],
      costs: {
        currency: 'USD',
        currentMonth: {
          start: '2026-05-01',
          end: '2026-06-01',
          costs: { '222': 12.5, '333': 7.25 },
        },
        previousMonth: {
          start: '2026-04-01',
          end: '2026-05-01',
          costs: { '222': 10, '333': 3 },
        },
      },
    })

    await renderAsyncServerComponent(AwsDashboardPage)

    expect(screen.getByText('o-123')).toBeInTheDocument()
    expect(screen.getAllByText('main@example.com')).toHaveLength(2)
    expect(screen.getByText('MAIN')).toBeInTheDocument()
    expect(screen.getByText('$19.75')).toBeInTheDocument()
    expect(screen.getByText('$13.00')).toBeInTheDocument()
    expect(screen.getByText('Zeta')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('SUSPENDED')).toBeInTheDocument()
    expect(screen.queryByText('PENDING_CLOSURE')).not.toBeInTheDocument()
  })
})

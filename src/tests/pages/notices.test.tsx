import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  queryWebpagesMock,
  queryReportsMock,
  resetCmsMocks,
} from '@/tests/mocks/cms'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import NoticesPage from '@/app/(stdev)/notices/page'
import PressPage from '@/app/(stdev)/notices/press/page'
import DonationPage from '@/app/(stdev)/notices/donation/page'
import RecordsPage from '@/app/(stdev)/notices/records/page'
import {
  makeWebpageWithBusiness,
  makeReportWithFile,
} from '@/tests/utils/fixtures'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

describe('NoticesPage', () => {
  it('renders 공지사항 heading', async () => {
    await renderAsyncServerComponent(() => NoticesPage())
    expect(
      screen.getByRole('heading', { name: '공지사항' }),
    ).toBeInTheDocument()
  })

  it('shows empty record list message', async () => {
    await renderAsyncServerComponent(() => NoticesPage())
    expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
  })
})

describe('PressPage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders 보도자료 heading', async () => {
    await renderAsyncServerComponent(() => PressPage())
    expect(
      screen.getByRole('heading', { name: '보도자료' }),
    ).toBeInTheDocument()
  })

  it('shows empty message when no press releases', async () => {
    queryWebpagesMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => PressPage())
    expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
  })

  it('renders press releases when present', async () => {
    queryWebpagesMock.mockResolvedValue([
      makeWebpageWithBusiness({
        title: '보도자료 제목',
        type: 'press_release',
      }),
    ])
    await renderAsyncServerComponent(() => PressPage())
    expect(screen.getByText('보도자료 제목')).toBeInTheDocument()
  })

  it('calls queryWebpages with press_release', async () => {
    await renderAsyncServerComponent(() => PressPage())
    expect(queryWebpagesMock).toHaveBeenCalledWith('press_release')
  })
})

describe('DonationPage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders 연간 기부금 모금액 및 활용실적 heading', async () => {
    await renderAsyncServerComponent(() => DonationPage())
    expect(
      screen.getByRole('heading', { name: '연간 기부금 모금액 및 활용실적' }),
    ).toBeInTheDocument()
  })

  it('shows empty message when no donation reports', async () => {
    queryReportsMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => DonationPage())
    expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
  })

  it('renders donation reports when present', async () => {
    queryReportsMock.mockResolvedValue([
      makeReportWithFile({ title: '2026 기부금 보고서', type: 'donation' }),
    ])
    await renderAsyncServerComponent(() => DonationPage())
    expect(screen.getByText('2026 기부금 보고서')).toBeInTheDocument()
  })

  it('calls queryReports with donation', async () => {
    await renderAsyncServerComponent(() => DonationPage())
    expect(queryReportsMock).toHaveBeenCalledWith('donation')
  })
})

describe('RecordsPage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders 총회 및 이사회 heading', async () => {
    await renderAsyncServerComponent(() => RecordsPage())
    expect(
      screen.getByRole('heading', { name: '총회 및 이사회' }),
    ).toBeInTheDocument()
  })

  it('shows empty message when no meeting records', async () => {
    queryReportsMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => RecordsPage())
    expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
  })

  it('renders meeting records when present', async () => {
    queryReportsMock.mockResolvedValue([
      makeReportWithFile({ title: '2026 이사회 의사록', type: 'meeting' }),
    ])
    await renderAsyncServerComponent(() => RecordsPage())
    expect(screen.getByText('2026 이사회 의사록')).toBeInTheDocument()
  })

  it('calls queryReports with meeting', async () => {
    await renderAsyncServerComponent(() => RecordsPage())
    expect(queryReportsMock).toHaveBeenCalledWith('meeting')
  })
})

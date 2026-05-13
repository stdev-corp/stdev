import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/prisma'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import { prismaMock, resetPrismaMock } from '@/tests/mocks/prisma'
import {
  makeBusiness,
  makeFileAsset,
  makeHistory,
  makeImageAsset,
  makeInstitution,
  makeMarkdown,
  makeReport,
  makeWebpage,
} from '@/tests/utils/fixtures'
import AdminDashboardPage from '@/app/(cms)/admin/(shell)/page'
import BusinessesPage from '@/app/(cms)/admin/(shell)/businesses/page'
import FilesPage from '@/app/(cms)/admin/(shell)/files/page'
import HistoriesPage from '@/app/(cms)/admin/(shell)/histories/page'
import ImagesPage from '@/app/(cms)/admin/(shell)/images/page'
import InstitutionsPage from '@/app/(cms)/admin/(shell)/institutions/page'
import MarkdownsPage from '@/app/(cms)/admin/(shell)/markdowns/page'
import ReportsPage from '@/app/(cms)/admin/(shell)/reports/page'
import SettingsPage from '@/app/(cms)/admin/(shell)/settings/page'
import WebpagesPage from '@/app/(cms)/admin/(shell)/webpages/page'

vi.mock('@/app/(cms)/admin/actions', () => ({
  createBusiness: vi.fn(),
  updateBusiness: vi.fn(),
  deleteBusiness: vi.fn(),
  createImageAsset: vi.fn(),
  updateImageAsset: vi.fn(),
  deleteImageAsset: vi.fn(),
  createFileAsset: vi.fn(),
  updateFileAsset: vi.fn(),
  deleteFileAsset: vi.fn(),
  createInstitution: vi.fn(),
  updateInstitution: vi.fn(),
  deleteInstitution: vi.fn(),
  createMarkdown: vi.fn(),
  updateMarkdown: vi.fn(),
  deleteMarkdown: vi.fn(),
  createWebpage: vi.fn(),
  updateWebpage: vi.fn(),
  deleteWebpage: vi.fn(),
  createReport: vi.fn(),
  updateReport: vi.fn(),
  deleteReport: vi.fn(),
  createHistory: vi.fn(),
  updateHistory: vi.fn(),
  deleteHistory: vi.fn(),
  createAdminSetting: vi.fn(),
  updateAdminSetting: vi.fn(),
  deleteAdminSetting: vi.fn(),
}))

describe('admin shell pages', () => {
  beforeEach(() => {
    resetPrismaMock()
  })

  it('renders dashboard stat cards from Prisma counts', async () => {
    prismaMock.business.count.mockResolvedValue(1)
    prismaMock.imageAsset.count.mockResolvedValue(2)
    prismaMock.fileAsset.count.mockResolvedValue(3)
    prismaMock.institution.count.mockResolvedValue(4)
    prismaMock.markdown.count.mockResolvedValue(5)
    prismaMock.webpage.count.mockResolvedValue(6)
    prismaMock.report.count.mockResolvedValue(7)
    prismaMock.history.count.mockResolvedValue(8)
    prismaMock.adminSettings.count.mockResolvedValue(9)

    await renderAsyncServerComponent(AdminDashboardPage)

    expect(
      screen.getByRole('heading', { name: '대시보드' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '사업' })).toHaveAttribute(
      'href',
      '/admin/businesses',
    )
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute(
      'href',
      '/admin/settings',
    )
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('renders businesses page ordered by id', async () => {
    prismaMock.business.findMany.mockResolvedValue([makeBusiness()])
    await renderAsyncServerComponent(BusinessesPage)
    expect(prismaMock.business.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    })
    expect(screen.getByRole('heading', { name: '사업' })).toBeInTheDocument()
  })

  it('renders images and files pages', async () => {
    prismaMock.imageAsset.findMany.mockResolvedValue([makeImageAsset()])
    await renderAsyncServerComponent(ImagesPage)
    expect(screen.getByRole('heading', { name: '이미지' })).toBeInTheDocument()

    prismaMock.fileAsset.findMany.mockResolvedValue([makeFileAsset()])
    await renderAsyncServerComponent(FilesPage)
    expect(screen.getByRole('heading', { name: '파일' })).toBeInTheDocument()
  })

  it('renders relation-backed entity pages with option data', async () => {
    prismaMock.history.findMany.mockResolvedValue([makeHistory()])
    prismaMock.imageAsset.findMany.mockResolvedValue([makeImageAsset()])
    await renderAsyncServerComponent(HistoriesPage)
    expect(screen.getByRole('heading', { name: '연혁' })).toBeInTheDocument()

    prismaMock.institution.findMany.mockResolvedValue([makeInstitution()])
    prismaMock.imageAsset.findMany.mockResolvedValue([makeImageAsset()])
    await renderAsyncServerComponent(InstitutionsPage)
    expect(screen.getByRole('heading', { name: '기관' })).toBeInTheDocument()

    prismaMock.report.findMany.mockResolvedValue([makeReport()])
    prismaMock.fileAsset.findMany.mockResolvedValue([makeFileAsset()])
    await renderAsyncServerComponent(ReportsPage)
    expect(screen.getByRole('heading', { name: '보고서' })).toBeInTheDocument()

    prismaMock.webpage.findMany.mockResolvedValue([makeWebpage()])
    prismaMock.business.findMany.mockResolvedValue([makeBusiness()])
    await renderAsyncServerComponent(WebpagesPage)
    expect(
      screen.getByRole('heading', { name: '웹페이지' }),
    ).toBeInTheDocument()
  })

  it('renders markdowns ordered by effective date', async () => {
    prismaMock.markdown.findMany.mockResolvedValue([makeMarkdown()])
    await renderAsyncServerComponent(MarkdownsPage)
    expect(prismaMock.markdown.findMany).toHaveBeenCalledWith({
      orderBy: { effectiveDate: 'desc' },
    })
    expect(
      screen.getByRole('heading', { name: '마크다운' }),
    ).toBeInTheDocument()
  })

  it('maps settings to non-secret summaries before rendering', async () => {
    prismaMock.adminSettings.findMany.mockResolvedValue([
      {
        id: 1,
        key: 'AWS_SECRET_ACCESS_KEY',
        value: 'actual-secret-value',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      },
    ])

    await renderAsyncServerComponent(SettingsPage)

    expect(prismaMock.adminSettings.findMany).toHaveBeenCalledWith({
      orderBy: { key: 'asc' },
      select: {
        id: true,
        key: true,
        createdAt: true,
        updatedAt: true,
        value: true,
      },
    })
    expect(screen.getByText('AWS_SECRET_ACCESS_KEY')).toBeInTheDocument()
    expect(screen.queryByText('actual-secret-value')).not.toBeInTheDocument()
    expect(screen.getByText('값: ••••••••••••')).toBeInTheDocument()
  })
})

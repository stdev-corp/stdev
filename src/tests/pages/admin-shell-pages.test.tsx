import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/prisma'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import { prismaMock, resetPrismaMock } from '@/tests/mocks/prisma'
import {
  makeBusiness,
  makeBusinessPage,
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
import BusinessPagesPage from '@/app/(cms)/admin/(shell)/business-pages/page'
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
  createBusinessPage: vi.fn(),
  updateBusinessPage: vi.fn(),
  deleteBusinessPage: vi.fn(),
  previewPageLinks: vi.fn(),
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
    prismaMock.businessPage.count.mockResolvedValue(10)
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
    expect(screen.getByRole('link', { name: '사업(행사)' })).toHaveAttribute(
      'href',
      '/admin/businesses',
    )
    expect(
      screen.getByRole('link', { name: '행사 하위 페이지' }),
    ).toHaveAttribute('href', '/admin/business-pages')
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute(
      'href',
      '/admin/settings',
    )
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('renders businesses newest-first with their institution links, institutions and images', async () => {
    prismaMock.business.findMany.mockResolvedValue([
      {
        ...makeBusiness({ id: 2, name: '2026 해커톤', slug: 'dsf26' }),
        institutions: [{ institutionId: 1, role: 'host', sortOrder: 0 }],
      },
      { ...makeBusiness({ id: 1, name: '2019 해커톤' }), institutions: [] },
    ] as never)
    prismaMock.institution.findMany.mockResolvedValue([
      { id: 1, nameKo: '과학기술정보통신부' },
    ] as never)
    prismaMock.imageAsset.findMany.mockResolvedValue([
      { id: 3, filename: 'cover.png', url: 'https://example.com/cover.png' },
    ] as never)

    await renderAsyncServerComponent(BusinessesPage)

    expect(prismaMock.business.findMany).toHaveBeenCalledWith({
      include: {
        institutions: {
          select: { institutionId: true, role: true, sortOrder: true },
        },
      },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    })
    expect(prismaMock.institution.findMany).toHaveBeenCalledWith({
      select: { id: true, nameKo: true },
      orderBy: { nameKo: 'asc' },
    })
    expect(prismaMock.imageAsset.findMany).toHaveBeenCalledWith({
      select: { id: true, filename: true, url: true },
      orderBy: { id: 'asc' },
    })
    expect(
      screen.getByRole('heading', { name: '사업(행사)' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/^#\d+ · /).map((item) => item.textContent),
    ).toEqual(['#2 · 2026 해커톤', '#1 · 2019 해커톤'])
    expect(screen.getByText('페이지 /hackathon/dsf26')).toBeInTheDocument()
  })

  it('renders event sub-pages with business options and images', async () => {
    prismaMock.businessPage.findMany.mockResolvedValue([
      makeBusinessPage({ id: 4, businessId: 2, path: 'faq', title: 'FAQ' }),
    ])
    prismaMock.business.findMany.mockResolvedValue([
      { id: 2, name: 'DSF 2026', slug: 'dsf26', category: 'hackathon' },
    ] as never)
    prismaMock.imageAsset.findMany.mockResolvedValue([
      { id: 3, filename: 'cover.png', url: 'https://example.com/cover.png' },
    ] as never)

    await renderAsyncServerComponent(BusinessPagesPage)

    expect(prismaMock.businessPage.findMany).toHaveBeenCalledWith({
      orderBy: [{ businessId: 'asc' }, { path: 'asc' }],
    })
    expect(prismaMock.business.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, slug: true, category: true },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    })
    expect(prismaMock.imageAsset.findMany).toHaveBeenCalledWith({
      select: { id: true, filename: true, url: true },
      orderBy: { id: 'asc' },
    })
    expect(
      screen.getByRole('heading', { name: '행사 하위 페이지' }),
    ).toBeInTheDocument()
    expect(screen.getByText('#4 · ❓ FAQ')).toBeInTheDocument()
    expect(
      screen.getByText('DSF 2026 · 페이지 /hackathon/dsf26/faq'),
    ).toBeInTheDocument()
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
    // 목록에 원문 저장본을 함께 보여 주고, 저장본 고르기는 최근 파일부터 보인다.
    expect(prismaMock.webpage.findMany).toHaveBeenCalledWith({
      include: { archive: true },
      orderBy: { publishedDate: 'desc' },
    })
    expect(prismaMock.fileAsset.findMany).toHaveBeenLastCalledWith({
      orderBy: { id: 'desc' },
    })
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

import { beforeEach, describe, expect, it } from 'vitest'
import '@/tests/mocks/prisma'
import '@/tests/mocks/auth'
import '@/tests/mocks/admin-auth'
import '@/tests/mocks/navigation'
import '@/tests/mocks/cache'
import '@/tests/mocks/s3'
import { prismaMock, resetPrismaMock } from '@/tests/mocks/prisma'
import {
  mockAdminAuthAllowed,
  mockAdminAuthForbidden,
  resetAdminAuthMocks,
} from '@/tests/mocks/admin-auth'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import AdminPage from '@/app/(cms)/admin/page'
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

describe('AdminPage', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    mockAdminAuthAllowed()
    prismaMock.business.findMany.mockResolvedValue([makeBusiness()])
    prismaMock.imageAsset.findMany.mockResolvedValue([makeImageAsset()])
    prismaMock.fileAsset.findMany.mockResolvedValue([makeFileAsset()])
    prismaMock.institution.findMany.mockResolvedValue([makeInstitution()])
    prismaMock.markdown.findMany.mockResolvedValue([makeMarkdown()])
    prismaMock.webpage.findMany.mockResolvedValue([makeWebpage()])
    prismaMock.report.findMany.mockResolvedValue([makeReport()])
    prismaMock.history.findMany.mockResolvedValue([makeHistory()])
  })

  it('calls business.findMany ordered by id asc', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(prismaMock.business.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    })
  })

  it('calls imageAsset.findMany ordered by id asc', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(prismaMock.imageAsset.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    })
  })

  it('calls fileAsset.findMany ordered by id asc', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(prismaMock.fileAsset.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    })
  })

  it('calls institution.findMany ordered by id asc', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(prismaMock.institution.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    })
  })

  it('calls markdown.findMany ordered by effectiveDate desc', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(prismaMock.markdown.findMany).toHaveBeenCalledWith({
      orderBy: { effectiveDate: 'desc' },
    })
  })

  it('calls webpage.findMany ordered by publishedDate desc', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(prismaMock.webpage.findMany).toHaveBeenCalledWith({
      orderBy: { publishedDate: 'desc' },
    })
  })

  it('calls report.findMany ordered by publishedDate desc', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(prismaMock.report.findMany).toHaveBeenCalledWith({
      orderBy: { publishedDate: 'desc' },
    })
  })

  it('calls history.findMany ordered by date desc', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(prismaMock.history.findMany).toHaveBeenCalledWith({
      orderBy: { date: 'desc' },
    })
  })

  it('renders AdminDashboard with session email', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(
      screen.getByText('admin@stdev.kr 계정으로 로그인했습니다.'),
    ).toBeInTheDocument()
  })

  it('renders STDev DIY CMS heading from AdminDashboard', async () => {
    await renderAsyncServerComponent(() => AdminPage())
    expect(
      screen.getByRole('heading', { name: 'STDev DIY CMS' }),
    ).toBeInTheDocument()
  })

  it('rejects when requireAdminPageSession rejects (not admin)', async () => {
    mockAdminAuthForbidden()
    await expect(AdminPage()).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;403')
    expect(prismaMock.business.findMany).not.toHaveBeenCalled()
  })
})

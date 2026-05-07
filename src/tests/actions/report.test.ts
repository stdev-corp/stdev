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
import { resetCacheMocks, revalidatePathMock } from '@/tests/mocks/cache'
import { resetS3ModuleMock } from '@/tests/mocks/s3'
import { createFormData } from '@/tests/utils/form-data'
import { makeReport } from '@/tests/utils/fixtures'
import {
  createReport,
  deleteReport,
  updateReport,
} from '@/app/(cms)/admin/actions'

describe('report actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
  })

  describe('createReport', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        title: '2026 1분기 회의록',
        publishedDate: '2026-03-31',
        type: 'meeting',
        fileId: '1',
      })
      await expect(createReport(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('creates meeting report and revalidates', async () => {
      prismaMock.report.create.mockResolvedValue(makeReport())
      const fd = createFormData({
        title: '2026 1분기 회의록',
        publishedDate: '2026-03-31',
        type: 'meeting',
        fileId: '1',
      })
      await createReport(fd)
      expect(prismaMock.report.create).toHaveBeenCalledWith({
        data: {
          title: '2026 1분기 회의록',
          publishedDate: new Date('2026-03-31'),
          type: 'meeting',
          fileId: 1,
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('creates donation report', async () => {
      prismaMock.report.create.mockResolvedValue(
        makeReport({ type: 'donation' }),
      )
      const fd = createFormData({
        title: '기부 내역',
        publishedDate: '2026-06-30',
        type: 'donation',
        fileId: '3',
      })
      await createReport(fd)
      expect(prismaMock.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'donation', fileId: 3 }),
      })
    })

    it('throws when fileId is missing', async () => {
      const fd = createFormData({
        title: 't',
        publishedDate: '2026-01-01',
        type: 'meeting',
      })
      await expect(createReport(fd)).rejects.toThrow('fileId is required')
    })

    it('throws when publishedDate is missing', async () => {
      const fd = createFormData({
        title: 't',
        type: 'meeting',
        fileId: '1',
      })
      await expect(createReport(fd)).rejects.toThrow(
        'publishedDate is required',
      )
    })

    it('translates P2003 from invalid fileId to relation message', async () => {
      prismaMock.report.create.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({
        title: 't',
        publishedDate: '2026-01-01',
        type: 'meeting',
        fileId: '999',
      })
      await expect(createReport(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })

    it('translates P2002 duplicate', async () => {
      prismaMock.report.create.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      )
      const fd = createFormData({
        title: 't',
        publishedDate: '2026-01-01',
        type: 'meeting',
        fileId: '1',
      })
      await expect(createReport(fd)).rejects.toThrow(/중복/)
    })
  })

  describe('updateReport', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        id: '1',
        title: 't',
        publishedDate: '2026-01-01',
        type: 'meeting',
        fileId: '1',
      })
      await expect(updateReport(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('updates by id and revalidates', async () => {
      prismaMock.report.update.mockResolvedValue(makeReport())
      const fd = createFormData({
        id: '12',
        title: '갱신된 보고서',
        publishedDate: '2026-09-30',
        type: 'donation',
        fileId: '4',
      })
      await updateReport(fd)
      expect(prismaMock.report.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: {
          title: '갱신된 보고서',
          publishedDate: new Date('2026-09-30'),
          type: 'donation',
          fileId: 4,
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('throws when id is missing', async () => {
      const fd = createFormData({
        title: 't',
        publishedDate: '2026-01-01',
        type: 'meeting',
        fileId: '1',
      })
      await expect(updateReport(fd)).rejects.toThrow('id is required')
    })

    it('translates P2025 not found', async () => {
      prismaMock.report.update.mockRejectedValue(
        Object.assign(new Error('nf'), { code: 'P2025' }),
      )
      const fd = createFormData({
        id: '1',
        title: 't',
        publishedDate: '2026-01-01',
        type: 'meeting',
        fileId: '1',
      })
      await expect(updateReport(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })
  })

  describe('deleteReport', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1' })
      await expect(deleteReport(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('deletes by id and revalidates', async () => {
      prismaMock.report.delete.mockResolvedValue(makeReport())
      const fd = createFormData({ id: '6' })
      await deleteReport(fd)
      expect(prismaMock.report.delete).toHaveBeenCalledWith({
        where: { id: 6 },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('translates P2003 on delete', async () => {
      prismaMock.report.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({ id: '1' })
      await expect(deleteReport(fd)).rejects.toThrow(
        /다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다/,
      )
    })
  })
})

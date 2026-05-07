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
import { makeHistory } from '@/tests/utils/fixtures'
import {
  createHistory,
  deleteHistory,
  updateHistory,
} from '@/app/(cms)/admin/actions'

describe('history actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
  })

  describe('createHistory', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        date: '2026-05-01',
        title: '첫 이사회',
      })
      await expect(createHistory(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('creates history with all fields and revalidates', async () => {
      prismaMock.history.create.mockResolvedValue(makeHistory())
      const fd = createFormData({
        date: '2026-05-01',
        title: '첫 이사회',
        content: '정관 채택',
        imageId: '2',
      })
      await createHistory(fd)
      expect(prismaMock.history.create).toHaveBeenCalledWith({
        data: {
          date: new Date('2026-05-01'),
          title: '첫 이사회',
          content: '정관 채택',
          imageId: 2,
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('creates with null content and null imageId when omitted', async () => {
      prismaMock.history.create.mockResolvedValue(makeHistory())
      const fd = createFormData({
        date: '2026-05-01',
        title: '첫 이사회',
      })
      await createHistory(fd)
      expect(prismaMock.history.create).toHaveBeenCalledWith({
        data: {
          date: new Date('2026-05-01'),
          title: '첫 이사회',
          content: null,
          imageId: null,
        },
      })
    })

    it('throws when date is missing', async () => {
      const fd = createFormData({ title: '제목' })
      await expect(createHistory(fd)).rejects.toThrow('date is required')
    })

    it('translates P2002 duplicate', async () => {
      prismaMock.history.create.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      )
      const fd = createFormData({
        date: '2026-05-01',
        title: '첫 이사회',
      })
      await expect(createHistory(fd)).rejects.toThrow(/중복/)
    })

    it('translates P2003 FK violation (invalid imageId)', async () => {
      prismaMock.history.create.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({
        date: '2026-05-01',
        title: '첫 이사회',
        imageId: '999',
      })
      await expect(createHistory(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })

    it('re-throws unknown errors', async () => {
      prismaMock.history.create.mockRejectedValue(new Error('boom'))
      const fd = createFormData({
        date: '2026-05-01',
        title: '첫 이사회',
      })
      await expect(createHistory(fd)).rejects.toThrow('boom')
    })
  })

  describe('updateHistory', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        id: '1',
        date: '2026-05-01',
        title: '제목',
      })
      await expect(updateHistory(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('updates by id and revalidates', async () => {
      prismaMock.history.update.mockResolvedValue(makeHistory())
      const fd = createFormData({
        id: '7',
        date: '2026-06-01',
        title: '업데이트된 제목',
        content: '새 본문',
        imageId: '4',
      })
      await updateHistory(fd)
      expect(prismaMock.history.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: {
          date: new Date('2026-06-01'),
          title: '업데이트된 제목',
          content: '새 본문',
          imageId: 4,
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('throws when id is missing', async () => {
      const fd = createFormData({
        date: '2026-05-01',
        title: '제목',
      })
      await expect(updateHistory(fd)).rejects.toThrow('id is required')
    })

    it('translates P2025 to relation message', async () => {
      prismaMock.history.update.mockRejectedValue(
        Object.assign(new Error('nf'), { code: 'P2025' }),
      )
      const fd = createFormData({
        id: '1',
        date: '2026-05-01',
        title: '제목',
      })
      await expect(updateHistory(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })
  })

  describe('deleteHistory', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1' })
      await expect(deleteHistory(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('deletes by id and revalidates', async () => {
      prismaMock.history.delete.mockResolvedValue(makeHistory())
      const fd = createFormData({ id: '3' })
      await deleteHistory(fd)
      expect(prismaMock.history.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('translates P2003 on delete', async () => {
      prismaMock.history.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({ id: '1' })
      await expect(deleteHistory(fd)).rejects.toThrow(
        /다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다/,
      )
    })

    it('re-throws non-P2003 errors on delete', async () => {
      prismaMock.history.delete.mockRejectedValue(new Error('oops'))
      const fd = createFormData({ id: '1' })
      await expect(deleteHistory(fd)).rejects.toThrow('oops')
    })
  })
})

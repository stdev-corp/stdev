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
import { makeBusiness } from '@/tests/utils/fixtures'
import {
  createBusiness,
  deleteBusiness,
  updateBusiness,
} from '@/app/(cms)/admin/actions'

describe('business actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
  })

  describe('createBusiness', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await expect(createBusiness(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
      expect(prismaMock.business.create).not.toHaveBeenCalled()
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('creates business with all fields and revalidates', async () => {
      prismaMock.business.create.mockResolvedValue(makeBusiness())
      const fd = createFormData({
        name: 'Hackathon 2026',
        code: 'HACK-2026',
        startDate: '2026-06-01',
        endDate: '2026-06-02',
        location: 'Seoul',
      })
      await createBusiness(fd)
      expect(prismaMock.business.create).toHaveBeenCalledWith({
        data: {
          name: 'Hackathon 2026',
          code: 'HACK-2026',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-02'),
          location: 'Seoul',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('creates business with null location when omitted', async () => {
      prismaMock.business.create.mockResolvedValue(makeBusiness())
      const fd = createFormData({
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await createBusiness(fd)
      expect(prismaMock.business.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ location: null }),
      })
    })

    it('throws when startDate is missing', async () => {
      const fd = createFormData({ name: 'X', code: 'X', endDate: '2026-01-02' })
      await expect(createBusiness(fd)).rejects.toThrow('startDate is required')
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('translates P2002 unique violation to Korean message', async () => {
      const error = Object.assign(new Error('unique'), { code: 'P2002' })
      prismaMock.business.create.mockRejectedValue(error)
      const fd = createFormData({
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await expect(createBusiness(fd)).rejects.toThrow(/중복/)
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('translates P2003 FK violation', async () => {
      const error = Object.assign(new Error('fk'), { code: 'P2003' })
      prismaMock.business.create.mockRejectedValue(error)
      const fd = createFormData({
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await expect(createBusiness(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })

    it('translates P2025 not found', async () => {
      const error = Object.assign(new Error('nf'), { code: 'P2025' })
      prismaMock.business.create.mockRejectedValue(error)
      const fd = createFormData({
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await expect(createBusiness(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })

    it('re-throws unknown errors', async () => {
      prismaMock.business.create.mockRejectedValue(new Error('boom'))
      const fd = createFormData({
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await expect(createBusiness(fd)).rejects.toThrow('boom')
    })
  })

  describe('updateBusiness', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        id: '1',
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await expect(updateBusiness(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('updates business by id and revalidates', async () => {
      prismaMock.business.update.mockResolvedValue(makeBusiness())
      const fd = createFormData({
        id: '5',
        name: 'Updated',
        code: 'UPD',
        startDate: '2026-07-01',
        endDate: '2026-07-02',
        location: 'Busan',
      })
      await updateBusiness(fd)
      expect(prismaMock.business.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          name: 'Updated',
          code: 'UPD',
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-02'),
          location: 'Busan',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('throws when id is missing', async () => {
      const fd = createFormData({
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await expect(updateBusiness(fd)).rejects.toThrow('id is required')
    })

    it('translates P2002 to duplicate message', async () => {
      const error = Object.assign(new Error('dup'), { code: 'P2002' })
      prismaMock.business.update.mockRejectedValue(error)
      const fd = createFormData({
        id: '1',
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      })
      await expect(updateBusiness(fd)).rejects.toThrow(/중복/)
    })
  })

  describe('deleteBusiness', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1' })
      await expect(deleteBusiness(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('deletes by id and revalidates', async () => {
      prismaMock.business.delete.mockResolvedValue(makeBusiness())
      const fd = createFormData({ id: '7' })
      await deleteBusiness(fd)
      expect(prismaMock.business.delete).toHaveBeenCalledWith({
        where: { id: 7 },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('translates P2003 on delete to in-use message', async () => {
      const error = Object.assign(new Error('fk'), { code: 'P2003' })
      prismaMock.business.delete.mockRejectedValue(error)
      const fd = createFormData({ id: '1' })
      await expect(deleteBusiness(fd)).rejects.toThrow(
        /다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다/,
      )
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('re-throws non-P2003 errors on delete', async () => {
      prismaMock.business.delete.mockRejectedValue(new Error('oops'))
      const fd = createFormData({ id: '1' })
      await expect(deleteBusiness(fd)).rejects.toThrow('oops')
    })

    it('throws when id is missing', async () => {
      const fd = createFormData({})
      await expect(deleteBusiness(fd)).rejects.toThrow('id is required')
    })
  })
})

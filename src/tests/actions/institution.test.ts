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
import { makeInstitution } from '@/tests/utils/fixtures'
import {
  createInstitution,
  deleteInstitution,
  updateInstitution,
} from '@/app/(cms)/admin/actions'

describe('institution actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
  })

  describe('createInstitution', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        nameKo: '기관',
        nameEn: 'Inst',
        url: 'https://example.com',
        logoId: '1',
      })
      await expect(createInstitution(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
      expect(prismaMock.institution.create).not.toHaveBeenCalled()
    })

    it('creates with logo reference and revalidates', async () => {
      prismaMock.institution.create.mockResolvedValue(makeInstitution())
      const fd = createFormData({
        nameKo: '기관명',
        nameEn: 'Institution',
        url: 'https://example.com',
        logoId: '3',
      })
      await createInstitution(fd)
      expect(prismaMock.institution.create).toHaveBeenCalledWith({
        data: {
          nameKo: '기관명',
          nameEn: 'Institution',
          url: 'https://example.com',
          logoId: 3,
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('rejects an unsafe HTTP URL', async () => {
      const fd = createFormData({
        nameKo: '기관',
        nameEn: 'Inst',
        url: 'http://example.com',
        logoId: '1',
      })
      await expect(createInstitution(fd)).rejects.toThrow(/올바른 HTTPS URL/)
    })

    it('throws when logoId is missing', async () => {
      const fd = createFormData({
        nameKo: '기관',
        nameEn: 'Inst',
        url: 'https://example.com',
      })
      await expect(createInstitution(fd)).rejects.toThrow('logoId is required')
    })

    it('translates P2003 from invalid logoId to relation message', async () => {
      prismaMock.institution.create.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({
        nameKo: '기관',
        nameEn: 'Inst',
        url: 'https://example.com',
        logoId: '999',
      })
      await expect(createInstitution(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })

    it('translates P2002 duplicate', async () => {
      prismaMock.institution.create.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      )
      const fd = createFormData({
        nameKo: '기관',
        nameEn: 'Inst',
        url: 'https://example.com',
        logoId: '1',
      })
      await expect(createInstitution(fd)).rejects.toThrow(/중복/)
    })
  })

  describe('updateInstitution', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        id: '1',
        nameKo: '기관',
        nameEn: 'Inst',
        url: 'https://example.com',
        logoId: '1',
      })
      await expect(updateInstitution(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('updates by id and revalidates', async () => {
      prismaMock.institution.update.mockResolvedValue(makeInstitution())
      const fd = createFormData({
        id: '10',
        nameKo: '수정',
        nameEn: 'Updated',
        url: 'https://updated.example.com',
        logoId: '7',
      })
      await updateInstitution(fd)
      expect(prismaMock.institution.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          nameKo: '수정',
          nameEn: 'Updated',
          url: 'https://updated.example.com',
          logoId: 7,
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('throws when id is missing', async () => {
      const fd = createFormData({
        nameKo: '기관',
        nameEn: 'Inst',
        url: 'https://example.com',
        logoId: '1',
      })
      await expect(updateInstitution(fd)).rejects.toThrow('id is required')
    })

    it('translates P2025 not found to relation message', async () => {
      prismaMock.institution.update.mockRejectedValue(
        Object.assign(new Error('nf'), { code: 'P2025' }),
      )
      const fd = createFormData({
        id: '1',
        nameKo: '기관',
        nameEn: 'Inst',
        url: 'https://example.com',
        logoId: '1',
      })
      await expect(updateInstitution(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })
  })

  describe('deleteInstitution', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1' })
      await expect(deleteInstitution(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('deletes by id and revalidates', async () => {
      prismaMock.institution.delete.mockResolvedValue(makeInstitution())
      const fd = createFormData({ id: '8' })
      await deleteInstitution(fd)
      expect(prismaMock.institution.delete).toHaveBeenCalledWith({
        where: { id: 8 },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('translates P2003 on delete to in-use message', async () => {
      prismaMock.institution.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({ id: '1' })
      await expect(deleteInstitution(fd)).rejects.toThrow(
        /다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다/,
      )
    })
  })
})

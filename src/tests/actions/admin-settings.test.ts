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
import { createFormData } from '@/tests/utils/form-data'
import {
  createAdminSetting,
  deleteAdminSetting,
  updateAdminSetting,
} from '@/app/(cms)/admin/actions'

const fixture = {
  id: 1,
  key: 'AWS_ACCESS_KEY_ID',
  value: 'AKIA',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('admin-settings actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    mockAdminAuthAllowed()
  })

  describe('createAdminSetting', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      await expect(
        createAdminSetting(createFormData({ key: 'k', value: 'v' })),
      ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;403')
      expect(prismaMock.adminSettings.create).not.toHaveBeenCalled()
    })

    it('creates setting and revalidates /admin/settings', async () => {
      prismaMock.adminSettings.create.mockResolvedValue(fixture as never)
      await createAdminSetting(
        createFormData({ key: 'AWS_ACCESS_KEY_ID', value: 'AKIA' }),
      )
      expect(prismaMock.adminSettings.create).toHaveBeenCalledWith({
        data: { key: 'AWS_ACCESS_KEY_ID', value: 'AKIA' },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin/settings')
    })

    it('translates P2002 unique violation to Korean message', async () => {
      const error = Object.assign(new Error('unique'), { code: 'P2002' })
      prismaMock.adminSettings.create.mockRejectedValue(error)
      await expect(
        createAdminSetting(createFormData({ key: 'k', value: 'v' })),
      ).rejects.toThrow(/중복/)
    })
  })

  describe('updateAdminSetting', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      await expect(
        updateAdminSetting(createFormData({ id: '1', value: 'v' })),
      ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;403')
      expect(prismaMock.adminSettings.update).not.toHaveBeenCalled()
    })

    it('updates value by id and revalidates', async () => {
      prismaMock.adminSettings.update.mockResolvedValue(fixture as never)
      await updateAdminSetting(createFormData({ id: '1', value: 'new' }))
      expect(prismaMock.adminSettings.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { value: 'new' },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin/settings')
    })
  })

  describe('deleteAdminSetting', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      await expect(
        deleteAdminSetting(createFormData({ id: '1' })),
      ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;403')
      expect(prismaMock.adminSettings.delete).not.toHaveBeenCalled()
    })

    it('deletes by id and revalidates', async () => {
      prismaMock.adminSettings.delete.mockResolvedValue(fixture as never)
      await deleteAdminSetting(createFormData({ id: '1' }))
      expect(prismaMock.adminSettings.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin/settings')
    })
  })
})

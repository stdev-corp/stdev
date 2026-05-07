import { beforeEach, describe, expect, it, vi } from 'vitest'
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
import {
  mockedDeleteManagedAsset,
  mockedUploadAsset,
  resetS3ModuleMock,
} from '@/tests/mocks/s3'
import { createFormData, createPngFile } from '@/tests/utils/form-data'
import { makeImageAsset } from '@/tests/utils/fixtures'
import {
  createImageAsset,
  deleteImageAsset,
  updateImageAsset,
} from '@/app/(cms)/admin/actions'

const validImageUrl =
  'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo.png'
const altImageUrl =
  'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/alt.png'

function uploadedPayload(
  overrides: Partial<{
    url: string
    filename: string
    mimeType: string | null
    prefix: string
  }> = {},
) {
  return {
    url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/123-logo.png',
    filename: '123-logo.png',
    mimeType: 'image/png',
    prefix: 'images' as const,
    ...overrides,
  }
}

describe('image-asset actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
  })

  describe('createImageAsset', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ url: validImageUrl })
      await expect(createImageAsset(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
      expect(mockedUploadAsset).not.toHaveBeenCalled()
    })

    it('uploads file and creates with uploaded metadata', async () => {
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      prismaMock.imageAsset.create.mockResolvedValue(makeImageAsset())
      const file = createPngFile('logo.png')
      const fd = createFormData({ file, alt: 'Logo' })
      await createImageAsset(fd)
      expect(mockedUploadAsset).toHaveBeenCalledWith(file, 'images')
      expect(prismaMock.imageAsset.create).toHaveBeenCalledWith({
        data: {
          alt: 'Logo',
          filename: '123-logo.png',
          url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/123-logo.png',
          mimeType: 'image/png',
          prefix: 'images',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('creates from URL without uploading', async () => {
      prismaMock.imageAsset.create.mockResolvedValue(makeImageAsset())
      const fd = createFormData({
        url: validImageUrl,
        alt: 'From URL',
        filename: 'logo.png',
        mimeType: 'image/png',
      })
      await createImageAsset(fd)
      expect(mockedUploadAsset).not.toHaveBeenCalled()
      expect(prismaMock.imageAsset.create).toHaveBeenCalledWith({
        data: {
          alt: 'From URL',
          filename: 'logo.png',
          url: validImageUrl,
          mimeType: 'image/png',
          prefix: 'images',
        },
      })
    })

    it('defaults mimeType and prefix when URL-only and not provided', async () => {
      prismaMock.imageAsset.create.mockResolvedValue(makeImageAsset())
      const fd = createFormData({ url: validImageUrl })
      await createImageAsset(fd)
      expect(prismaMock.imageAsset.create).toHaveBeenCalledWith({
        data: {
          alt: null,
          filename: null,
          url: validImageUrl,
          mimeType: 'image/*',
          prefix: 'images',
        },
      })
    })

    it('throws when neither file nor URL supplied', async () => {
      const fd = createFormData({})
      await expect(createImageAsset(fd)).rejects.toThrow(
        /파일 업로드 또는 기존 URL/,
      )
    })

    it('rejects an unsafe image URL', async () => {
      const fd = createFormData({ url: 'http://evil.example.com/x.png' })
      await expect(createImageAsset(fd)).rejects.toThrow(/허용된 S3 호스트/)
    })

    it('deletes uploaded asset when prisma create fails', async () => {
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      const error = Object.assign(new Error('dup'), { code: 'P2002' })
      prismaMock.imageAsset.create.mockRejectedValue(error)
      const fd = createFormData({ file: createPngFile('logo.png') })
      await expect(createImageAsset(fd)).rejects.toThrow(/중복/)
      expect(mockedDeleteManagedAsset).toHaveBeenCalledWith(
        'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/123-logo.png',
      )
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })
  })

  describe('updateImageAsset', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1', url: validImageUrl })
      await expect(updateImageAsset(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('updates from new file and removes old unreferenced image', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(
        makeImageAsset({ id: 9, url: altImageUrl }),
      )
      prismaMock.imageAsset.count.mockResolvedValue(0)
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      prismaMock.imageAsset.update.mockResolvedValue(makeImageAsset({ id: 9 }))
      const fd = createFormData({ id: '9', file: createPngFile('new.png') })
      await updateImageAsset(fd)
      expect(prismaMock.imageAsset.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: expect.objectContaining({
          url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/123-logo.png',
          filename: '123-logo.png',
          mimeType: 'image/png',
          prefix: 'images',
        }),
      })
      expect(prismaMock.imageAsset.count).toHaveBeenCalledWith({
        where: { url: altImageUrl, id: { not: 9 } },
      })
      expect(mockedDeleteManagedAsset).toHaveBeenCalledWith(altImageUrl)
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('keeps the old S3 asset when still referenced elsewhere', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(
        makeImageAsset({ id: 9, url: altImageUrl }),
      )
      prismaMock.imageAsset.count.mockResolvedValue(2)
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      prismaMock.imageAsset.update.mockResolvedValue(makeImageAsset({ id: 9 }))
      const fd = createFormData({ id: '9', file: createPngFile('new.png') })
      await updateImageAsset(fd)
      expect(mockedDeleteManagedAsset).not.toHaveBeenCalled()
    })

    it('updates from URL without upload', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(
        makeImageAsset({ id: 3, url: altImageUrl }),
      )
      prismaMock.imageAsset.update.mockResolvedValue(makeImageAsset({ id: 3 }))
      const fd = createFormData({
        id: '3',
        url: validImageUrl,
        alt: 'new',
      })
      await updateImageAsset(fd)
      expect(mockedUploadAsset).not.toHaveBeenCalled()
      expect(prismaMock.imageAsset.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: expect.objectContaining({ url: validImageUrl, alt: 'new' }),
      })
      expect(mockedDeleteManagedAsset).not.toHaveBeenCalled()
    })

    it('best-effort deletes the new upload when update fails', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(
        makeImageAsset({ id: 1, url: altImageUrl }),
      )
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      const error = Object.assign(new Error('fk'), { code: 'P2003' })
      prismaMock.imageAsset.update.mockRejectedValue(error)
      const fd = createFormData({ id: '1', file: createPngFile('x.png') })
      await expect(updateImageAsset(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
      expect(mockedDeleteManagedAsset).toHaveBeenCalledWith(
        'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/123-logo.png',
      )
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('throws when neither file nor URL supplied', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(makeImageAsset())
      const fd = createFormData({ id: '1' })
      await expect(updateImageAsset(fd)).rejects.toThrow(
        /파일 업로드 또는 기존 URL/,
      )
    })
  })

  describe('deleteImageAsset', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1' })
      await expect(deleteImageAsset(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('deletes record and unreferenced S3 asset', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(
        makeImageAsset({ id: 1, url: validImageUrl }),
      )
      prismaMock.imageAsset.delete.mockResolvedValue(makeImageAsset({ id: 1 }))
      prismaMock.imageAsset.count.mockResolvedValue(0)
      const fd = createFormData({ id: '1' })
      await deleteImageAsset(fd)
      expect(prismaMock.imageAsset.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
      expect(prismaMock.imageAsset.count).toHaveBeenCalledWith({
        where: { url: validImageUrl },
      })
      expect(mockedDeleteManagedAsset).toHaveBeenCalledWith(validImageUrl)
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('skips S3 delete when still referenced', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(
        makeImageAsset({ id: 1, url: validImageUrl }),
      )
      prismaMock.imageAsset.delete.mockResolvedValue(makeImageAsset({ id: 1 }))
      prismaMock.imageAsset.count.mockResolvedValue(3)
      const fd = createFormData({ id: '1' })
      await deleteImageAsset(fd)
      expect(mockedDeleteManagedAsset).not.toHaveBeenCalled()
    })

    it('translates P2003 to in-use message', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(makeImageAsset())
      const error = Object.assign(new Error('fk'), { code: 'P2003' })
      prismaMock.imageAsset.delete.mockRejectedValue(error)
      const fd = createFormData({ id: '1' })
      await expect(deleteImageAsset(fd)).rejects.toThrow(
        /다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다/,
      )
    })

    it('skips unreferenced-image cleanup when existing record has no url', async () => {
      prismaMock.imageAsset.findUnique.mockResolvedValue(null)
      prismaMock.imageAsset.delete.mockResolvedValue(makeImageAsset({ id: 1 }))
      const fd = createFormData({ id: '1' })
      await deleteImageAsset(fd)
      expect(prismaMock.imageAsset.count).not.toHaveBeenCalled()
      expect(mockedDeleteManagedAsset).not.toHaveBeenCalled()
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('swallows and logs S3 delete failures on best-effort cleanup', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      prismaMock.imageAsset.findUnique.mockResolvedValue(
        makeImageAsset({ id: 1, url: validImageUrl }),
      )
      prismaMock.imageAsset.delete.mockResolvedValue(makeImageAsset({ id: 1 }))
      prismaMock.imageAsset.count.mockResolvedValue(0)
      mockedDeleteManagedAsset.mockRejectedValue(new Error('s3 failure'))
      const fd = createFormData({ id: '1' })
      await deleteImageAsset(fd)
      expect(errorSpy).toHaveBeenCalled()
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
      errorSpy.mockRestore()
    })
  })
})

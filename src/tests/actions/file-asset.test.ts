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
import {
  mockedDeleteManagedAsset,
  mockedUploadAsset,
  resetS3ModuleMock,
} from '@/tests/mocks/s3'
import { createFormData, createPdfFile } from '@/tests/utils/form-data'
import { makeFileAsset } from '@/tests/utils/fixtures'
import {
  createFileAsset,
  deleteFileAsset,
  updateFileAsset,
} from '@/app/(cms)/admin/actions'

const validPdfUrl =
  'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/report.pdf'
const otherPdfUrl =
  'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/other.pdf'

function uploadedPayload(
  overrides: Partial<{
    url: string
    filename: string
    mimeType: string | null
    prefix: string
  }> = {},
) {
  return {
    url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/123-report.pdf',
    filename: '123-report.pdf',
    mimeType: 'application/pdf',
    prefix: 'files' as const,
    ...overrides,
  }
}

describe('file-asset actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
  })

  describe('createFileAsset', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ url: validPdfUrl, filename: 'r.pdf' })
      await expect(createFileAsset(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
      expect(mockedUploadAsset).not.toHaveBeenCalled()
    })

    it('uploads file and creates with uploaded metadata', async () => {
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      prismaMock.fileAsset.create.mockResolvedValue(makeFileAsset())
      const file = createPdfFile('report.pdf')
      const fd = createFormData({ file })
      await createFileAsset(fd)
      expect(mockedUploadAsset).toHaveBeenCalledWith(file, 'files')
      expect(prismaMock.fileAsset.create).toHaveBeenCalledWith({
        data: {
          filename: '123-report.pdf',
          url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/123-report.pdf',
          mimeType: 'application/pdf',
          prefix: 'files',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('creates from URL without uploading', async () => {
      prismaMock.fileAsset.create.mockResolvedValue(makeFileAsset())
      const fd = createFormData({
        url: validPdfUrl,
        filename: 'report.pdf',
        mimeType: 'application/pdf',
      })
      await createFileAsset(fd)
      expect(mockedUploadAsset).not.toHaveBeenCalled()
      expect(prismaMock.fileAsset.create).toHaveBeenCalledWith({
        data: {
          filename: 'report.pdf',
          url: validPdfUrl,
          mimeType: 'application/pdf',
          prefix: 'files',
        },
      })
    })

    it('defaults mimeType when URL-only and not provided', async () => {
      prismaMock.fileAsset.create.mockResolvedValue(makeFileAsset())
      const fd = createFormData({ url: validPdfUrl, filename: 'r.pdf' })
      await createFileAsset(fd)
      expect(prismaMock.fileAsset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mimeType: 'application/pdf',
          prefix: 'files',
        }),
      })
    })

    it('throws when neither file nor URL supplied', async () => {
      const fd = createFormData({})
      await expect(createFileAsset(fd)).rejects.toThrow(
        /파일 업로드 또는 기존 URL/,
      )
    })

    it('rejects non-pdf URLs', async () => {
      const fd = createFormData({
        url: 'https://example.com/not-a-pdf',
        filename: 'x.pdf',
      })
      await expect(createFileAsset(fd)).rejects.toThrow(/HTTPS PDF URL/)
    })

    it('deletes uploaded asset when prisma create fails', async () => {
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      const error = Object.assign(new Error('dup'), { code: 'P2002' })
      prismaMock.fileAsset.create.mockRejectedValue(error)
      const fd = createFormData({ file: createPdfFile('x.pdf') })
      await expect(createFileAsset(fd)).rejects.toThrow(/중복/)
      expect(mockedDeleteManagedAsset).toHaveBeenCalledWith(
        'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/123-report.pdf',
      )
    })

    it('translates P2003 to relation message', async () => {
      prismaMock.fileAsset.create.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({ url: validPdfUrl, filename: 'r.pdf' })
      await expect(createFileAsset(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })
  })

  describe('updateFileAsset', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        id: '1',
        url: validPdfUrl,
        filename: 'r.pdf',
      })
      await expect(updateFileAsset(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('updates from new file and removes old unreferenced file', async () => {
      prismaMock.fileAsset.findUnique.mockResolvedValue(
        makeFileAsset({ id: 9, url: otherPdfUrl }),
      )
      prismaMock.fileAsset.count.mockResolvedValue(0)
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      prismaMock.fileAsset.update.mockResolvedValue(makeFileAsset({ id: 9 }))
      const fd = createFormData({ id: '9', file: createPdfFile('new.pdf') })
      await updateFileAsset(fd)
      expect(prismaMock.fileAsset.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: expect.objectContaining({
          filename: '123-report.pdf',
          url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/123-report.pdf',
        }),
      })
      expect(prismaMock.fileAsset.count).toHaveBeenCalledWith({
        where: { url: otherPdfUrl, id: { not: 9 } },
      })
      expect(mockedDeleteManagedAsset).toHaveBeenCalledWith(otherPdfUrl)
    })

    it('keeps the old S3 asset when still referenced', async () => {
      prismaMock.fileAsset.findUnique.mockResolvedValue(
        makeFileAsset({ id: 9, url: otherPdfUrl }),
      )
      prismaMock.fileAsset.count.mockResolvedValue(5)
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      prismaMock.fileAsset.update.mockResolvedValue(makeFileAsset({ id: 9 }))
      const fd = createFormData({ id: '9', file: createPdfFile('new.pdf') })
      await updateFileAsset(fd)
      expect(mockedDeleteManagedAsset).not.toHaveBeenCalled()
    })

    it('updates from URL without upload', async () => {
      prismaMock.fileAsset.findUnique.mockResolvedValue(
        makeFileAsset({ id: 2, url: otherPdfUrl }),
      )
      prismaMock.fileAsset.update.mockResolvedValue(makeFileAsset({ id: 2 }))
      const fd = createFormData({
        id: '2',
        url: validPdfUrl,
        filename: 'report.pdf',
      })
      await updateFileAsset(fd)
      expect(mockedUploadAsset).not.toHaveBeenCalled()
      expect(prismaMock.fileAsset.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: expect.objectContaining({ url: validPdfUrl }),
      })
      expect(mockedDeleteManagedAsset).not.toHaveBeenCalled()
    })

    it('best-effort deletes new upload when update fails', async () => {
      prismaMock.fileAsset.findUnique.mockResolvedValue(
        makeFileAsset({ id: 1, url: otherPdfUrl }),
      )
      mockedUploadAsset.mockResolvedValue(uploadedPayload())
      prismaMock.fileAsset.update.mockRejectedValue(
        Object.assign(new Error('nf'), { code: 'P2025' }),
      )
      const fd = createFormData({ id: '1', file: createPdfFile('x.pdf') })
      await expect(updateFileAsset(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
      expect(mockedDeleteManagedAsset).toHaveBeenCalledWith(
        'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/123-report.pdf',
      )
    })
  })

  describe('deleteFileAsset', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1' })
      await expect(deleteFileAsset(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('deletes record and unreferenced S3 file', async () => {
      prismaMock.fileAsset.findUnique.mockResolvedValue(
        makeFileAsset({ id: 1, url: validPdfUrl }),
      )
      prismaMock.fileAsset.delete.mockResolvedValue(makeFileAsset({ id: 1 }))
      prismaMock.fileAsset.count.mockResolvedValue(0)
      const fd = createFormData({ id: '1' })
      await deleteFileAsset(fd)
      expect(prismaMock.fileAsset.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
      expect(prismaMock.fileAsset.count).toHaveBeenCalledWith({
        where: { url: validPdfUrl },
      })
      expect(mockedDeleteManagedAsset).toHaveBeenCalledWith(validPdfUrl)
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('skips S3 delete when referenced elsewhere', async () => {
      prismaMock.fileAsset.findUnique.mockResolvedValue(
        makeFileAsset({ id: 1, url: validPdfUrl }),
      )
      prismaMock.fileAsset.delete.mockResolvedValue(makeFileAsset({ id: 1 }))
      prismaMock.fileAsset.count.mockResolvedValue(2)
      const fd = createFormData({ id: '1' })
      await deleteFileAsset(fd)
      expect(mockedDeleteManagedAsset).not.toHaveBeenCalled()
    })

    it('translates P2003 to in-use message', async () => {
      prismaMock.fileAsset.findUnique.mockResolvedValue(makeFileAsset())
      prismaMock.fileAsset.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({ id: '1' })
      await expect(deleteFileAsset(fd)).rejects.toThrow(
        /다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다/,
      )
    })

    it('skips unreferenced-file cleanup when existing record has no url', async () => {
      prismaMock.fileAsset.findUnique.mockResolvedValue(null)
      prismaMock.fileAsset.delete.mockResolvedValue(makeFileAsset({ id: 1 }))
      const fd = createFormData({ id: '1' })
      await deleteFileAsset(fd)
      expect(prismaMock.fileAsset.count).not.toHaveBeenCalled()
      expect(mockedDeleteManagedAsset).not.toHaveBeenCalled()
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })
  })
})

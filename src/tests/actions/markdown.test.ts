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
import { makeMarkdown } from '@/tests/utils/fixtures'
import {
  createMarkdown,
  deleteMarkdown,
  updateMarkdown,
} from '@/app/(cms)/admin/actions'

describe('markdown actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
  })

  describe('createMarkdown', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        type: 'articles',
        revisionDate: '2026-01-01',
        effectiveDate: '2026-01-10',
        content: '# hi',
      })
      await expect(createMarkdown(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('creates markdown and revalidates', async () => {
      prismaMock.markdown.create.mockResolvedValue(makeMarkdown())
      const fd = createFormData({
        type: 'articles',
        revisionDate: '2026-01-01',
        effectiveDate: '2026-01-10',
        content: '# 정관\n\n본문',
      })
      await createMarkdown(fd)
      expect(prismaMock.markdown.create).toHaveBeenCalledWith({
        data: {
          type: 'articles',
          revisionDate: new Date('2026-01-01'),
          effectiveDate: new Date('2026-01-10'),
          content: '# 정관\n\n본문',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('passes privacy type through unchanged', async () => {
      prismaMock.markdown.create.mockResolvedValue(
        makeMarkdown({ type: 'privacy' }),
      )
      const fd = createFormData({
        type: 'privacy',
        revisionDate: '2026-02-01',
        effectiveDate: '2026-02-02',
        content: 'body',
      })
      await createMarkdown(fd)
      expect(prismaMock.markdown.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'privacy' }),
      })
    })

    it('passes terms type through unchanged', async () => {
      prismaMock.markdown.create.mockResolvedValue(
        makeMarkdown({ type: 'terms' }),
      )
      const fd = createFormData({
        type: 'terms',
        revisionDate: '2026-02-01',
        effectiveDate: '2026-02-02',
        content: 'body',
      })
      await createMarkdown(fd)
      expect(prismaMock.markdown.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'terms' }),
      })
    })

    it.each([
      ['hackathon', '해커톤&아이디어톤 구역 소개'],
      ['conference', '컨퍼런스&프로그램 구역 소개'],
    ])('accepts the %s section intro type', async (type, content) => {
      prismaMock.markdown.create.mockResolvedValue(
        makeMarkdown({ type: type as 'hackathon' | 'conference' }),
      )
      const fd = createFormData({
        type,
        revisionDate: '2026-11-01',
        effectiveDate: '2026-11-01',
        content,
      })
      await createMarkdown(fd)
      expect(prismaMock.markdown.create).toHaveBeenCalledWith({
        data: {
          type,
          revisionDate: new Date('2026-11-01'),
          effectiveDate: new Date('2026-11-01'),
          content,
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it.each([
      ['unknown type', 'notice'],
      ['missing type', ''],
      ['differently cased type', 'Hackathon'],
    ])('rejects an invalid markdown type (%s)', async (_label, type) => {
      const fd = createFormData({
        type,
        revisionDate: '2026-01-01',
        effectiveDate: '2026-01-10',
        content: 'body',
      })
      await expect(createMarkdown(fd)).rejects.toThrow(
        '마크다운 유형이 올바르지 않습니다.',
      )
      expect(prismaMock.markdown.create).not.toHaveBeenCalled()
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('throws when revisionDate is missing', async () => {
      const fd = createFormData({
        type: 'articles',
        effectiveDate: '2026-01-10',
        content: 'body',
      })
      await expect(createMarkdown(fd)).rejects.toThrow(
        'revisionDate is required',
      )
    })

    it('throws when effectiveDate is missing', async () => {
      const fd = createFormData({
        type: 'articles',
        revisionDate: '2026-01-01',
        content: 'body',
      })
      await expect(createMarkdown(fd)).rejects.toThrow(
        'effectiveDate is required',
      )
    })

    it('translates P2002 to duplicate message', async () => {
      prismaMock.markdown.create.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      )
      const fd = createFormData({
        type: 'articles',
        revisionDate: '2026-01-01',
        effectiveDate: '2026-01-10',
        content: 'body',
      })
      await expect(createMarkdown(fd)).rejects.toThrow(/중복/)
    })

    it('re-throws unknown errors', async () => {
      prismaMock.markdown.create.mockRejectedValue(new Error('boom'))
      const fd = createFormData({
        type: 'articles',
        revisionDate: '2026-01-01',
        effectiveDate: '2026-01-10',
        content: 'body',
      })
      await expect(createMarkdown(fd)).rejects.toThrow('boom')
    })
  })

  describe('updateMarkdown', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        id: '1',
        type: 'articles',
        revisionDate: '2026-01-01',
        effectiveDate: '2026-01-10',
        content: 'body',
      })
      await expect(updateMarkdown(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('updates by id and revalidates', async () => {
      prismaMock.markdown.update.mockResolvedValue(makeMarkdown())
      const fd = createFormData({
        id: '4',
        type: 'terms',
        revisionDate: '2026-03-01',
        effectiveDate: '2026-03-10',
        content: 'updated',
      })
      await updateMarkdown(fd)
      expect(prismaMock.markdown.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: {
          type: 'terms',
          revisionDate: new Date('2026-03-01'),
          effectiveDate: new Date('2026-03-10'),
          content: 'updated',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('updates a section intro to the conference type', async () => {
      prismaMock.markdown.update.mockResolvedValue(makeMarkdown())
      const fd = createFormData({
        id: '6',
        type: 'conference',
        revisionDate: '2026-11-01',
        effectiveDate: '2026-11-02',
        content: '소개',
      })
      await updateMarkdown(fd)
      expect(prismaMock.markdown.update).toHaveBeenCalledWith({
        where: { id: 6 },
        data: expect.objectContaining({ type: 'conference' }),
      })
    })

    it('rejects an invalid type on update', async () => {
      const fd = createFormData({
        id: '6',
        type: 'blog',
        revisionDate: '2026-11-01',
        effectiveDate: '2026-11-02',
        content: '소개',
      })
      await expect(updateMarkdown(fd)).rejects.toThrow(
        '마크다운 유형이 올바르지 않습니다.',
      )
      expect(prismaMock.markdown.update).not.toHaveBeenCalled()
    })

    it('throws when id is missing', async () => {
      const fd = createFormData({
        type: 'articles',
        revisionDate: '2026-01-01',
        effectiveDate: '2026-01-10',
        content: 'body',
      })
      await expect(updateMarkdown(fd)).rejects.toThrow('id is required')
    })

    it('translates P2025 not found to relation message', async () => {
      prismaMock.markdown.update.mockRejectedValue(
        Object.assign(new Error('nf'), { code: 'P2025' }),
      )
      const fd = createFormData({
        id: '1',
        type: 'articles',
        revisionDate: '2026-01-01',
        effectiveDate: '2026-01-10',
        content: 'body',
      })
      await expect(updateMarkdown(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })
  })

  describe('deleteMarkdown', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1' })
      await expect(deleteMarkdown(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('deletes by id and revalidates', async () => {
      prismaMock.markdown.delete.mockResolvedValue(makeMarkdown())
      const fd = createFormData({ id: '2' })
      await deleteMarkdown(fd)
      expect(prismaMock.markdown.delete).toHaveBeenCalledWith({
        where: { id: 2 },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('translates P2003 on delete to in-use message', async () => {
      prismaMock.markdown.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({ id: '1' })
      await expect(deleteMarkdown(fd)).rejects.toThrow(
        /다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다/,
      )
    })

    it('re-throws non-P2003 delete errors', async () => {
      prismaMock.markdown.delete.mockRejectedValue(new Error('oops'))
      const fd = createFormData({ id: '1' })
      await expect(deleteMarkdown(fd)).rejects.toThrow('oops')
    })
  })
})

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
import { makeWebpage } from '@/tests/utils/fixtures'
import {
  createWebpage,
  deleteWebpage,
  updateWebpage,
} from '@/app/(cms)/admin/actions'

const validUrl = 'https://blog.example.com/post'

describe('webpage actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
  })

  describe('createWebpage', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'blog_post',
      })
      await expect(createWebpage(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('creates webpage with null businessId when omitted', async () => {
      prismaMock.webpage.create.mockResolvedValue(makeWebpage())
      const fd = createFormData({
        url: validUrl,
        title: '블로그 글',
        author: '홍길동',
        publishedDate: '2026-05-01',
        type: 'blog_post',
      })
      await createWebpage(fd)
      expect(prismaMock.webpage.create).toHaveBeenCalledWith({
        data: {
          url: validUrl,
          title: '블로그 글',
          author: '홍길동',
          publishedDate: new Date('2026-05-01'),
          businessId: null,
          type: 'blog_post',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('creates webpage with numeric businessId', async () => {
      prismaMock.webpage.create.mockResolvedValue(
        makeWebpage({ businessId: 5 }),
      )
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'news_article',
        businessId: '5',
      })
      await createWebpage(fd)
      expect(prismaMock.webpage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessId: 5,
          type: 'news_article',
        }),
      })
    })

    it('accepts press_release type', async () => {
      prismaMock.webpage.create.mockResolvedValue(makeWebpage())
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'press_release',
      })
      await createWebpage(fd)
      expect(prismaMock.webpage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'press_release' }),
      })
    })

    it('rejects an unsafe HTTP URL', async () => {
      const fd = createFormData({
        url: 'http://insecure.example.com/post',
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'blog_post',
      })
      await expect(createWebpage(fd)).rejects.toThrow(/올바른 HTTPS URL/)
    })

    it('throws when publishedDate is missing', async () => {
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        type: 'blog_post',
      })
      await expect(createWebpage(fd)).rejects.toThrow(
        'publishedDate is required',
      )
    })

    it('translates P2003 to relation message', async () => {
      prismaMock.webpage.create.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'blog_post',
        businessId: '999',
      })
      await expect(createWebpage(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })

    it('translates P2002 duplicate', async () => {
      prismaMock.webpage.create.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      )
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'blog_post',
      })
      await expect(createWebpage(fd)).rejects.toThrow(/중복/)
    })
  })

  describe('updateWebpage', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({
        id: '1',
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'blog_post',
      })
      await expect(updateWebpage(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('updates by id and revalidates', async () => {
      prismaMock.webpage.update.mockResolvedValue(makeWebpage())
      const fd = createFormData({
        id: '11',
        url: validUrl,
        title: 'updated',
        author: '저자',
        publishedDate: '2026-06-01',
        type: 'news_article',
        businessId: '2',
      })
      await updateWebpage(fd)
      expect(prismaMock.webpage.update).toHaveBeenCalledWith({
        where: { id: 11 },
        data: {
          url: validUrl,
          title: 'updated',
          author: '저자',
          publishedDate: new Date('2026-06-01'),
          businessId: 2,
          type: 'news_article',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('throws when id is missing', async () => {
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'blog_post',
      })
      await expect(updateWebpage(fd)).rejects.toThrow('id is required')
    })

    it('translates P2025 not found', async () => {
      prismaMock.webpage.update.mockRejectedValue(
        Object.assign(new Error('nf'), { code: 'P2025' }),
      )
      const fd = createFormData({
        id: '1',
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'blog_post',
      })
      await expect(updateWebpage(fd)).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })
  })

  describe('deleteWebpage', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      const fd = createFormData({ id: '1' })
      await expect(deleteWebpage(fd)).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
    })

    it('deletes by id and revalidates', async () => {
      prismaMock.webpage.delete.mockResolvedValue(makeWebpage())
      const fd = createFormData({ id: '4' })
      await deleteWebpage(fd)
      expect(prismaMock.webpage.delete).toHaveBeenCalledWith({
        where: { id: 4 },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('translates P2003 on delete', async () => {
      prismaMock.webpage.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      const fd = createFormData({ id: '1' })
      await expect(deleteWebpage(fd)).rejects.toThrow(
        /다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다/,
      )
    })
  })
})

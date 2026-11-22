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

    it('creates a blog post linked to its business and revalidates', async () => {
      prismaMock.webpage.create.mockResolvedValue(makeWebpage())
      const fd = createFormData({
        url: validUrl,
        title: '블로그 글',
        author: '홍길동',
        publishedDate: '2026-05-01',
        type: 'blog_post',
        businessId: '3',
      })
      await createWebpage(fd)
      expect(prismaMock.webpage.create).toHaveBeenCalledWith({
        data: {
          url: validUrl,
          title: '블로그 글',
          author: '홍길동',
          publishedDate: new Date('2026-05-01'),
          businessId: 3,
          type: 'blog_post',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it.each(['blog_post', 'news_article'])(
      'requires a business for %s',
      async (type) => {
        const fd = createFormData({
          url: validUrl,
          title: 't',
          author: 'a',
          publishedDate: '2026-05-01',
          type,
        })
        await expect(createWebpage(fd)).rejects.toThrow(
          '뉴스 기사와 블로그 포스트는 관련 행사(사업)를 선택해야 합니다.',
        )
        expect(prismaMock.webpage.create).not.toHaveBeenCalled()
        expect(revalidatePathMock).not.toHaveBeenCalled()
      },
    )

    it('treats an empty business selection as missing for news articles', async () => {
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'news_article',
        businessId: '',
      })
      await expect(createWebpage(fd)).rejects.toThrow(
        /관련 행사\(사업\)를 선택/,
      )
    })

    it.each([
      ['unknown type', 'podcast'],
      ['missing type', ''],
    ])('rejects an invalid webpage type (%s)', async (_label, type) => {
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type,
        businessId: '1',
      })
      await expect(createWebpage(fd)).rejects.toThrow(
        '웹페이지 유형이 올바르지 않습니다.',
      )
      expect(prismaMock.webpage.create).not.toHaveBeenCalled()
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

    it('accepts press_release without a business', async () => {
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
        data: expect.objectContaining({
          type: 'press_release',
          businessId: null,
        }),
      })
    })

    it('keeps an optional business on a press release', async () => {
      prismaMock.webpage.create.mockResolvedValue(makeWebpage())
      const fd = createFormData({
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'press_release',
        businessId: '2',
      })
      await createWebpage(fd)
      expect(prismaMock.webpage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'press_release',
          businessId: 2,
        }),
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
        businessId: '1',
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

    it('requires a business when updating a blog post', async () => {
      const fd = createFormData({
        id: '11',
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'blog_post',
      })
      await expect(updateWebpage(fd)).rejects.toThrow(
        /관련 행사\(사업\)를 선택해야 합니다/,
      )
      expect(prismaMock.webpage.update).not.toHaveBeenCalled()
    })

    it('rejects an invalid type on update', async () => {
      const fd = createFormData({
        id: '11',
        url: validUrl,
        title: 't',
        author: 'a',
        publishedDate: '2026-05-01',
        type: 'video',
        businessId: '1',
      })
      await expect(updateWebpage(fd)).rejects.toThrow(
        '웹페이지 유형이 올바르지 않습니다.',
      )
      expect(prismaMock.webpage.update).not.toHaveBeenCalled()
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
        businessId: '1',
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

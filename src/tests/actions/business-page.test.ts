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
import { makeBusinessPage } from '@/tests/utils/fixtures'
import {
  createBusinessPage,
  deleteBusinessPage,
  updateBusinessPage,
} from '@/app/(cms)/admin/actions'

function pageForm(overrides: Record<string, string | null | undefined> = {}) {
  return createFormData({
    businessId: '1',
    path: 'faq',
    title: 'FAQ',
    ...overrides,
  })
}

const minimalData = {
  businessId: 1,
  path: 'faq',
  title: 'FAQ',
  icon: null,
  coverImageId: null,
  content: '',
  notionId: null,
}

describe('business page actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
    prismaMock.businessPage.create.mockResolvedValue(makeBusinessPage())
    prismaMock.businessPage.update.mockResolvedValue(makeBusinessPage())
    prismaMock.businessPage.delete.mockResolvedValue(makeBusinessPage())
  })

  describe('createBusinessPage', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      await expect(createBusinessPage(pageForm())).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
      expect(prismaMock.businessPage.create).not.toHaveBeenCalled()
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('creates a page with every field and revalidates', async () => {
      await createBusinessPage(
        pageForm({
          businessId: '3',
          path: 'notice/team-building',
          title: '팀 빌딩 안내',
          icon: '📢',
          coverImageId: '8',
          content: ':::callout{icon="💡"}\n안내\n:::',
          notionId: '17e3ff07ff5b81cb9285c5a141c41055',
        }),
      )
      expect(prismaMock.businessPage.create).toHaveBeenCalledWith({
        data: {
          businessId: 3,
          path: 'notice/team-building',
          title: '팀 빌딩 안내',
          icon: '📢',
          coverImageId: 8,
          content: ':::callout{icon="💡"}\n안내\n:::',
          notionId: '17e3ff07-ff5b-81cb-9285-c5a141c41055',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('stores null for omitted optional fields', async () => {
      await createBusinessPage(pageForm())
      expect(prismaMock.businessPage.create).toHaveBeenCalledWith({
        data: minimalData,
      })
    })

    it('accepts an image URL icon', async () => {
      await createBusinessPage(
        pageForm({
          icon: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/i.png',
        }),
      )
      expect(prismaMock.businessPage.create.mock.calls[0][0].data.icon).toBe(
        'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/i.png',
      )
    })

    it.each([
      ['single segment with digits', 'apply-2026'],
      ['nested path', 'notice/team-building'],
      ['deep path', 'a/b-c/d1'],
    ])('accepts a valid path (%s)', async (_label, path) => {
      await createBusinessPage(pageForm({ path }))
      expect(prismaMock.businessPage.create.mock.calls[0][0].data.path).toBe(
        path,
      )
    })

    it.each([
      ['empty', ''],
      ['leading slash', '/faq'],
      ['trailing slash', 'faq/'],
      ['double slash', 'notice//team'],
      ['uppercase', 'FAQ'],
      ['space', 'team building'],
      ['dot segment', '../faq'],
      ['underscore', 'team_building'],
    ])('rejects an invalid path (%s)', async (_label, path) => {
      await expect(createBusinessPage(pageForm({ path }))).rejects.toThrow(
        /경로는 영문 소문자·숫자·하이픈으로 된 이름을/,
      )
      expect(prismaMock.businessPage.create).not.toHaveBeenCalled()
    })

    it('throws when businessId is missing', async () => {
      await expect(
        createBusinessPage(pageForm({ businessId: null })),
      ).rejects.toThrow('businessId is required')
      expect(prismaMock.businessPage.create).not.toHaveBeenCalled()
    })

    it('rejects an invalid icon', async () => {
      await expect(
        createBusinessPage(pageForm({ icon: 'FAQ 아이콘' })),
      ).rejects.toThrow('아이콘은 이모지 한 글자 또는 이미지 주소여야 합니다.')
    })

    it('rejects an invalid notion id', async () => {
      await expect(
        createBusinessPage(pageForm({ notionId: 'not-a-notion-id' })),
      ).rejects.toThrow('노션 ID는 32자리 16진수(대시 포함 가능)여야 합니다.')
    })

    it('translates a duplicate [businessId, path] to the duplicate message', async () => {
      prismaMock.businessPage.create.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      )
      await expect(createBusinessPage(pageForm())).rejects.toThrow(
        '행사 페이지 저장 중 중복된 값이 있습니다. 고유한 값으로 다시 시도해주세요.',
      )
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('translates a missing business to the relation message', async () => {
      prismaMock.businessPage.create.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      await expect(
        createBusinessPage(pageForm({ businessId: '999' })),
      ).rejects.toThrow(
        '행사 페이지 저장 중 연결된 데이터가 올바르지 않습니다. 선택한 관계 데이터를 다시 확인해주세요.',
      )
    })
  })

  describe('updateBusinessPage', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      await expect(updateBusinessPage(pageForm({ id: '2' }))).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
      expect(prismaMock.businessPage.update).not.toHaveBeenCalled()
    })

    it('updates by id and revalidates', async () => {
      await updateBusinessPage(
        pageForm({
          id: '2',
          businessId: '4',
          path: 'apply',
          title: '지원 안내',
          icon: '/images/apply.svg',
        }),
      )
      expect(prismaMock.businessPage.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: {
          ...minimalData,
          businessId: 4,
          path: 'apply',
          title: '지원 안내',
          icon: '/images/apply.svg',
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('validates the path before touching the database', async () => {
      await expect(
        updateBusinessPage(pageForm({ id: '2', path: 'Apply' })),
      ).rejects.toThrow(/경로는/)
      expect(prismaMock.businessPage.update).not.toHaveBeenCalled()
    })

    it('throws when id is missing', async () => {
      await expect(updateBusinessPage(pageForm())).rejects.toThrow(
        'id is required',
      )
    })

    it('translates P2025 not found to relation message', async () => {
      prismaMock.businessPage.update.mockRejectedValue(
        Object.assign(new Error('nf'), { code: 'P2025' }),
      )
      await expect(updateBusinessPage(pageForm({ id: '2' }))).rejects.toThrow(
        /행사 페이지 저장 중 연결된 데이터가 올바르지 않습니다/,
      )
    })

    it('translates P2002 to duplicate message', async () => {
      prismaMock.businessPage.update.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      )
      await expect(updateBusinessPage(pageForm({ id: '2' }))).rejects.toThrow(
        /행사 페이지 저장 중 중복된 값/,
      )
    })
  })

  describe('deleteBusinessPage', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      await expect(
        deleteBusinessPage(createFormData({ id: '1' })),
      ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;403')
      expect(prismaMock.businessPage.delete).not.toHaveBeenCalled()
    })

    it('deletes by id and revalidates', async () => {
      await deleteBusinessPage(createFormData({ id: '6' }))
      expect(prismaMock.businessPage.delete).toHaveBeenCalledWith({
        where: { id: 6 },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('translates P2003 on delete to in-use message', async () => {
      prismaMock.businessPage.delete.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      await expect(
        deleteBusinessPage(createFormData({ id: '1' })),
      ).rejects.toThrow(
        '행사 페이지 항목이 다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다. 연결된 데이터를 먼저 정리해주세요.',
      )
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('re-throws other delete errors', async () => {
      prismaMock.businessPage.delete.mockRejectedValue(new Error('oops'))
      await expect(
        deleteBusinessPage(createFormData({ id: '1' })),
      ).rejects.toThrow('oops')
    })

    it('throws when id is missing', async () => {
      await expect(deleteBusinessPage(createFormData({}))).rejects.toThrow(
        'id is required',
      )
    })
  })
})

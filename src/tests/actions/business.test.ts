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

/** 필수 값만 채운 행사 폼. 각 테스트가 필요한 필드만 덮어쓴다. */
function businessForm(
  overrides: Record<string, string | null | undefined> = {},
) {
  return createFormData({
    name: 'X',
    code: 'X',
    startDate: '2026-01-01',
    endDate: '2026-01-02',
    ...overrides,
  })
}

/** 아무 선택값도 없는 폼이 저장할 기본 데이터. */
const minimalData = {
  name: 'X',
  code: 'X',
  slug: null,
  category: 'hackathon',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2026-01-02T00:00:00.000Z'),
  hasTime: false,
  location: null,
  icon: null,
  coverImageId: null,
  summary: null,
  content: '',
  notionId: null,
}

function createdData() {
  return prismaMock.business.create.mock.calls[0][0].data
}

describe('business actions', () => {
  beforeEach(() => {
    resetPrismaMock()
    resetAdminAuthMocks()
    resetCacheMocks()
    resetS3ModuleMock()
    mockAdminAuthAllowed()
    prismaMock.business.create.mockResolvedValue(makeBusiness())
    prismaMock.business.update.mockResolvedValue(makeBusiness())
  })

  describe('createBusiness', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      await expect(createBusiness(businessForm())).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
      expect(prismaMock.business.create).not.toHaveBeenCalled()
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('creates business with all fields, KST times and ordered institution links', async () => {
      const fd = businessForm({
        name: 'DSF 2026',
        code: 'DSF-2026',
        slug: 'dsf26',
        category: 'conference',
        startDate: '2026-02-23',
        startTime: '14:00',
        endDate: '2026-02-24',
        endTime: '19:00',
        location: '서울 강남구',
        icon: '🌸',
        coverImageId: '4',
        summary: '요약 **본문**',
        content: '# 행사 소개',
        notionId: '1B83FF07FF5B8051810EEA2915CDC850',
        role_host: '3, 1',
        role_organizer: '2',
        role_sponsor: '',
        role_partner: '5',
      })
      await createBusiness(fd)
      expect(prismaMock.business.create).toHaveBeenCalledWith({
        data: {
          name: 'DSF 2026',
          code: 'DSF-2026',
          slug: 'dsf26',
          category: 'conference',
          // 14:00 KST = 05:00 UTC, 19:00 KST = 10:00 UTC
          startDate: new Date('2026-02-23T05:00:00.000Z'),
          endDate: new Date('2026-02-24T10:00:00.000Z'),
          hasTime: true,
          location: '서울 강남구',
          icon: '🌸',
          coverImageId: 4,
          summary: '요약 **본문**',
          content: '# 행사 소개',
          notionId: '1b83ff07-ff5b-8051-810e-ea2915cdc850',
          institutions: {
            create: [
              { institutionId: 3, role: 'host', sortOrder: 0 },
              { institutionId: 1, role: 'host', sortOrder: 1 },
              { institutionId: 2, role: 'organizer', sortOrder: 0 },
              { institutionId: 5, role: 'partner', sortOrder: 0 },
            ],
          },
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('fills defaults for omitted optional fields (date-only, hackathon, no links)', async () => {
      await createBusiness(businessForm())
      expect(prismaMock.business.create).toHaveBeenCalledWith({
        data: { ...minimalData, institutions: { create: [] } },
      })
    })

    it('treats a blank category as hackathon', async () => {
      await createBusiness(businessForm({ category: '' }))
      expect(createdData()).toMatchObject({ category: 'hackathon' })
    })

    it.each(['hackathon', 'ideathon', 'conference', 'program'])(
      'accepts category %s',
      async (category) => {
        await createBusiness(businessForm({ category }))
        expect(createdData()).toMatchObject({ category })
      },
    )

    it('rejects an unknown category', async () => {
      await expect(
        createBusiness(businessForm({ category: 'festival' })),
      ).rejects.toThrow('행사 분류가 올바르지 않습니다.')
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('accepts a hyphenated lowercase slug', async () => {
      await createBusiness(businessForm({ slug: 'ai-hackathon-2026' }))
      expect(createdData()).toMatchObject({ slug: 'ai-hackathon-2026' })
    })

    it.each([
      ['uppercase', 'DSF26'],
      ['underscore', 'dsf_26'],
      ['leading hyphen', '-dsf'],
      ['double hyphen', 'dsf--26'],
      ['slash', 'dsf/26'],
      ['reserved news', 'news'],
      ['reserved blog', 'blog'],
    ])('rejects an invalid slug (%s)', async (_label, slug) => {
      await expect(createBusiness(businessForm({ slug }))).rejects.toThrow(
        /슬러그는 영문 소문자·숫자·하이픈만/,
      )
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('stores a date-only period as UTC midnight', async () => {
      await createBusiness(
        businessForm({ startDate: '2026-04-18', endDate: '2026-04-19' }),
      )
      expect(createdData()).toMatchObject({
        startDate: new Date('2026-04-18T00:00:00.000Z'),
        endDate: new Date('2026-04-19T00:00:00.000Z'),
        hasTime: false,
      })
    })

    it('converts times across the KST date boundary', async () => {
      await createBusiness(
        businessForm({
          startDate: '2026-03-01',
          startTime: '08:30',
          endDate: '2026-03-01',
          endTime: '23:59',
        }),
      )
      expect(createdData()).toMatchObject({
        startDate: new Date('2026-02-28T23:30:00.000Z'),
        endDate: new Date('2026-03-01T14:59:00.000Z'),
        hasTime: true,
      })
    })

    it('allows an end that equals the start', async () => {
      await createBusiness(
        businessForm({ startDate: '2026-05-01', endDate: '2026-05-01' }),
      )
      expect(prismaMock.business.create).toHaveBeenCalledTimes(1)
    })

    it.each([
      ['start time only', { startTime: '10:00' }],
      ['end time only', { endTime: '18:00' }],
    ])('requires start and end times together (%s)', async (_label, times) => {
      await expect(createBusiness(businessForm(times))).rejects.toThrow(
        '시작·종료 시각은 모두 입력하거나 모두 비워 주세요.',
      )
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('rejects an end date before the start date', async () => {
      await expect(
        createBusiness(
          businessForm({ startDate: '2026-06-02', endDate: '2026-06-01' }),
        ),
      ).rejects.toThrow('종료 일시가 시작 일시보다 앞설 수 없습니다.')
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('rejects an end time before the start time on the same day', async () => {
      await expect(
        createBusiness(
          businessForm({
            startDate: '2026-06-01',
            startTime: '14:00',
            endDate: '2026-06-01',
            endTime: '13:59',
          }),
        ),
      ).rejects.toThrow('종료 일시가 시작 일시보다 앞설 수 없습니다.')
    })

    it('throws when startDate is missing', async () => {
      const fd = createFormData({ name: 'X', code: 'X', endDate: '2026-01-02' })
      await expect(createBusiness(fd)).rejects.toThrow(
        '날짜는 YYYY-MM-DD 형식이어야 합니다.',
      )
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('rejects a malformed time', async () => {
      await expect(
        createBusiness(businessForm({ startTime: '9:00', endTime: '18:00' })),
      ).rejects.toThrow('시각은 HH:mm 형식이어야 합니다.')
    })

    it.each([
      ['single emoji', '🌸'],
      ['two emoji', '🎉🎊'],
      ['ZWJ family emoji (one grapheme)', '👨‍👩‍👧‍👦'],
      ['https image URL', 'https://example.com/icon.png'],
      ['site-internal path', '/images/icon.png'],
    ])('accepts icon: %s', async (_label, icon) => {
      await createBusiness(businessForm({ icon }))
      expect(createdData()).toMatchObject({ icon })
    })

    it.each([['three characters', 'abc']])(
      'rejects a non-emoji, non-URL icon (%s)',
      async (_label, icon) => {
        await expect(createBusiness(businessForm({ icon }))).rejects.toThrow(
          '아이콘은 이모지 한 글자 또는 이미지 주소여야 합니다.',
        )
        expect(prismaMock.business.create).not.toHaveBeenCalled()
      },
    )

    it.each([
      ['protocol-relative path', '//evil.example.com/icon.png'],
      ['unparseable https URL', 'https://'],
      ['https URL with a space in the host', 'https://exa mple.com/x.png'],
      // 브라우저가 https://evil.example.com 으로 읽는 경로
      ['backslash path', '/\\evil.example.com/x.png'],
      ['http URL', 'http://example.com/icon.png'],
      // new URL()은 받아들이지만 렌더러(isImageIcon)는 글자로 보여 주는 값
      ['https without slashes', 'https:example.com/icon.png'],
      ['https with one slash', 'https:/example.com/icon.png'],
      ['path with a space', '/images/a b.png'],
    ])('rejects an unsafe icon address (%s)', async (_label, icon) => {
      await expect(createBusiness(businessForm({ icon }))).rejects.toThrow(
        '아이콘 주소가 올바르지 않습니다.',
      )
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('normalizes a dashed notion id to lowercase', async () => {
      await createBusiness(
        businessForm({ notionId: '17E3FF07-FF5B-81CB-9285-C5A141C41055' }),
      )
      expect(createdData()).toMatchObject({
        notionId: '17e3ff07-ff5b-81cb-9285-c5a141c41055',
      })
    })

    it.each([
      ['too short', '1b83ff07ff5b8051'],
      ['non-hex', 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'],
      ['page URL', 'https://app.notion.com/p/1b83ff07ff5b8051810eea2915cdc850'],
    ])('rejects an invalid notion id (%s)', async (_label, notionId) => {
      await expect(createBusiness(businessForm({ notionId }))).rejects.toThrow(
        '노션 ID는 32자리 16진수(대시 포함 가능)여야 합니다.',
      )
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('dedupes repeated institutions within a role but keeps them across roles', async () => {
      await createBusiness(
        businessForm({
          role_host: '7,2,7,,2',
          role_sponsor: '7',
        }),
      )
      expect(createdData().institutions).toEqual({
        create: [
          { institutionId: 7, role: 'host', sortOrder: 0 },
          { institutionId: 2, role: 'host', sortOrder: 1 },
          { institutionId: 7, role: 'sponsor', sortOrder: 0 },
        ],
      })
    })

    it('orders links host → organizer → sponsor → partner regardless of form order', async () => {
      const fd = new FormData()
      for (const [key, value] of Object.entries({
        name: 'X',
        code: 'X',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        role_partner: '4',
        role_sponsor: '3',
        role_organizer: '2',
        role_host: '1',
      })) {
        fd.append(key, value)
      }
      await createBusiness(fd)
      expect(createdData().institutions).toEqual({
        create: [
          { institutionId: 1, role: 'host', sortOrder: 0 },
          { institutionId: 2, role: 'organizer', sortOrder: 0 },
          { institutionId: 3, role: 'sponsor', sortOrder: 0 },
          { institutionId: 4, role: 'partner', sortOrder: 0 },
        ],
      })
    })

    it.each([
      ['non-numeric', 'abc'],
      ['zero', '0'],
      ['negative', '-1'],
      ['fractional', '1.5'],
    ])('rejects an invalid institution id (%s)', async (_label, value) => {
      await expect(
        createBusiness(businessForm({ role_organizer: `1,${value}` })),
      ).rejects.toThrow('주최·주관·후원·협력 기관 선택이 올바르지 않습니다.')
      expect(prismaMock.business.create).not.toHaveBeenCalled()
    })

    it('translates P2002 unique violation to Korean message', async () => {
      prismaMock.business.create.mockRejectedValue(
        Object.assign(new Error('unique'), { code: 'P2002' }),
      )
      await expect(
        createBusiness(businessForm({ slug: 'dsf26' })),
      ).rejects.toThrow(
        '사업 저장 중 중복된 값이 있습니다. 고유한 값으로 다시 시도해주세요.',
      )
      expect(revalidatePathMock).not.toHaveBeenCalled()
    })

    it('translates P2003 FK violation', async () => {
      prismaMock.business.create.mockRejectedValue(
        Object.assign(new Error('fk'), { code: 'P2003' }),
      )
      await expect(
        createBusiness(businessForm({ role_host: '999' })),
      ).rejects.toThrow(/연결된 데이터가 올바르지 않습니다/)
    })

    it('translates P2025 not found', async () => {
      prismaMock.business.create.mockRejectedValue(
        Object.assign(new Error('nf'), { code: 'P2025' }),
      )
      await expect(createBusiness(businessForm())).rejects.toThrow(
        /연결된 데이터가 올바르지 않습니다/,
      )
    })

    it('re-throws unknown errors', async () => {
      prismaMock.business.create.mockRejectedValue(new Error('boom'))
      await expect(createBusiness(businessForm())).rejects.toThrow('boom')
    })

    it('re-throws non-Error rejections untouched', async () => {
      prismaMock.business.create.mockRejectedValue('plain failure')
      await expect(createBusiness(businessForm())).rejects.toBe('plain failure')
    })
  })

  describe('updateBusiness', () => {
    it('throws forbidden when not admin', async () => {
      mockAdminAuthForbidden()
      await expect(updateBusiness(businessForm({ id: '1' }))).rejects.toThrow(
        'NEXT_HTTP_ERROR_FALLBACK;403',
      )
      expect(prismaMock.business.update).not.toHaveBeenCalled()
    })

    it('updates business by id and replaces institution links in form order', async () => {
      const fd = businessForm({
        id: '5',
        name: 'Updated',
        code: 'UPD',
        slug: 'upd',
        category: 'program',
        startDate: '2026-07-01',
        endDate: '2026-07-02',
        location: 'Busan',
        role_host: '9,8',
        role_sponsor: '8',
      })
      await updateBusiness(fd)
      expect(prismaMock.business.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          ...minimalData,
          name: 'Updated',
          code: 'UPD',
          slug: 'upd',
          category: 'program',
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2026-07-02T00:00:00.000Z'),
          location: 'Busan',
          institutions: {
            deleteMany: {},
            create: [
              { institutionId: 9, role: 'host', sortOrder: 0 },
              { institutionId: 8, role: 'host', sortOrder: 1 },
              { institutionId: 8, role: 'sponsor', sortOrder: 0 },
            ],
          },
        },
      })
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    })

    it('clears every institution link when no role is submitted', async () => {
      await updateBusiness(businessForm({ id: '5' }))
      expect(
        prismaMock.business.update.mock.calls[0][0].data.institutions,
      ).toEqual({ deleteMany: {}, create: [] })
    })

    it('stores KST times on update', async () => {
      await updateBusiness(
        businessForm({
          id: '5',
          startDate: '2026-02-23',
          startTime: '14:00',
          endDate: '2026-02-23',
          endTime: '18:00',
        }),
      )
      expect(prismaMock.business.update.mock.calls[0][0].data).toMatchObject({
        startDate: new Date('2026-02-23T05:00:00.000Z'),
        endDate: new Date('2026-02-23T09:00:00.000Z'),
        hasTime: true,
      })
    })

    it('validates fields before touching the database', async () => {
      await expect(
        updateBusiness(businessForm({ id: '5', slug: 'blog' })),
      ).rejects.toThrow(/슬러그/)
      expect(prismaMock.business.update).not.toHaveBeenCalled()
    })

    it('throws when id is missing', async () => {
      await expect(updateBusiness(businessForm())).rejects.toThrow(
        'id is required',
      )
    })

    it('translates P2002 to duplicate message', async () => {
      prismaMock.business.update.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      )
      await expect(
        updateBusiness(businessForm({ id: '1', slug: 'dsf26' })),
      ).rejects.toThrow(
        '사업 저장 중 중복된 값이 있습니다. 고유한 값으로 다시 시도해주세요.',
      )
      expect(revalidatePathMock).not.toHaveBeenCalled()
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

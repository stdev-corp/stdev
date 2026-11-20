'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminActionSession } from '@/utils/admin-auth'
import {
  date,
  optionalNumber,
  optionalText,
  recordId,
  requiredNumber,
  text,
} from '@/utils/admin-form'
import { prisma } from '@/utils/prisma'
import { deleteManagedAsset, uploadAsset } from '@/utils/s3'
import {
  requireSafeHttpsUrl,
  requireSafeImageUrl,
  requireSafePdfUrl,
} from '@/utils/public-url'
import type {
  BusinessCategory,
  BusinessRole,
  MarkdownType,
} from '@/utils/cms-types'
import { safeUrl } from '@/utils/notion-markdown'
import {
  CATEGORY_LABELS,
  isImageIcon,
  isValidPagePath,
  isValidSlug,
  normalizeNotionId,
  ROLE_ORDER,
  toEventInstant,
} from '@/utils/events'

async function withDeleteMessage<T>(
  action: () => Promise<T>,
  itemName: string,
) {
  try {
    await action()
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2003'
    ) {
      throw new Error(
        `${itemName} 항목이 다른 콘텐츠에서 사용 중이어서 삭제할 수 없습니다. 연결된 데이터를 먼저 정리해주세요.`,
      )
    }

    throw error
  }
}

async function withMutationMessage<T>(
  action: () => Promise<T>,
  itemName: string,
) {
  try {
    return await action()
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new Error(
        `${itemName} 저장 중 중복된 값이 있습니다. 고유한 값으로 다시 시도해주세요.`,
      )
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === 'P2003' || error.code === 'P2025')
    ) {
      throw new Error(
        `${itemName} 저장 중 연결된 데이터가 올바르지 않습니다. 선택한 관계 데이터를 다시 확인해주세요.`,
      )
    }

    throw error
  }
}

async function bestEffortDeleteManagedAsset(url: string | null | undefined) {
  try {
    await deleteManagedAsset(url)
  } catch (error) {
    console.error('Failed to delete managed S3 asset', url, error)
  }
}

/**
 * 행사 본문·요약·아이콘이나 구역 소개 마크다운이 이미지 주소를 직접 쓰는지 센다.
 * 이런 참조는 외래 키가 없어 DB가 막아 주지 못하므로 지우기 전에 직접 확인한다.
 */
async function countContentReferences(url: string) {
  const [businesses, pages, markdowns] = await Promise.all([
    prisma.business.count({
      where: {
        OR: [
          { content: { contains: url } },
          { summary: { contains: url } },
          { icon: url },
        ],
      },
    }),
    prisma.businessPage.count({
      where: { OR: [{ content: { contains: url } }, { icon: url }] },
    }),
    prisma.markdown.count({ where: { content: { contains: url } } }),
  ])
  return businesses + pages + markdowns
}

async function maybeDeleteUnreferencedImage(
  url: string | null | undefined,
  keepId?: number,
) {
  if (!url) {
    return
  }

  const count = await prisma.imageAsset.count({
    where: {
      url,
      ...(keepId ? { id: { not: keepId } } : {}),
    },
  })

  // 본문이 주소를 직접 쓰고 있으면 S3 객체는 남겨 둔다.
  if (count === 0 && (await countContentReferences(url)) === 0) {
    await bestEffortDeleteManagedAsset(url)
  }
}

async function maybeDeleteUnreferencedFile(
  url: string | null | undefined,
  keepId?: number,
) {
  if (!url) {
    return
  }

  const count = await prisma.fileAsset.count({
    where: {
      url,
      ...(keepId ? { id: { not: keepId } } : {}),
    },
  })

  // 본문(::video 등)이 주소를 직접 쓰고 있으면 S3 객체는 남겨 둔다.
  if (count === 0 && (await countContentReferences(url)) === 0) {
    await bestEffortDeleteManagedAsset(url)
  }
}

function uploadedFile(formData: FormData, key: string) {
  const value = formData.get(key)
  if (!isUploadedFile(value) || value.size === 0) {
    return null
  }
  return value
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'size' in value &&
    'type' in value
  )
}

function requiredUrlOrUpload(
  formData: FormData,
  fileKey: string,
  urlKey: string,
) {
  const file = uploadedFile(formData, fileKey)
  const url = text(formData, urlKey)

  if (!file && !url) {
    throw new Error('파일 업로드 또는 기존 URL 중 하나는 반드시 필요합니다.')
  }

  return { file, url }
}

const BUSINESS_CATEGORIES = Object.keys(CATEGORY_LABELS) as BusinessCategory[]

function businessCategory(formData: FormData): BusinessCategory {
  const value = text(formData, 'category') || 'hackathon'
  if (!BUSINESS_CATEGORIES.includes(value as BusinessCategory)) {
    throw new Error('행사 분류가 올바르지 않습니다.')
  }
  return value as BusinessCategory
}

function optionalSlug(formData: FormData) {
  const slug = optionalText(formData, 'slug')
  if (slug && !isValidSlug(slug)) {
    throw new Error(
      '슬러그는 영문 소문자·숫자·하이픈만 쓸 수 있고, news·blog와 노션 ID 모양(32자리 16진수)은 쓸 수 없습니다.',
    )
  }
  return slug
}

function optionalNotionId(formData: FormData) {
  const value = optionalText(formData, 'notionId')
  if (!value) {
    return null
  }
  const notionId = normalizeNotionId(value)
  if (!notionId) {
    throw new Error('노션 ID는 32자리 16진수(대시 포함 가능)여야 합니다.')
  }
  return notionId
}

const graphemes = new Intl.Segmenter('ko', { granularity: 'grapheme' })

/** 노션 아이콘: 이모지 한두 글자, 또는 https·사이트 내부 이미지 주소 */
function optionalIcon(formData: FormData) {
  const icon = optionalText(formData, 'icon')
  if (!icon) {
    return null
  }
  if (/^(https?:|\/)/.test(icon)) {
    // 공개 페이지 렌더러(isImageIcon + safeUrl)와 같은 규칙으로 검사해야 저장 뒤
    // 아이콘이 사라지거나 글자로 보이지 않는다.
    if (!isImageIcon(icon) || !safeUrl(icon)) {
      throw new Error('아이콘 주소가 올바르지 않습니다.')
    }
    return icon
  }
  if ([...graphemes.segment(icon)].length > 2) {
    throw new Error('아이콘은 이모지 한 글자 또는 이미지 주소여야 합니다.')
  }
  return icon
}

/** 시작/종료 날짜와 선택 시각을 읽는다. 시각은 둘 다 있거나 둘 다 없어야 한다. */
function eventPeriod(formData: FormData) {
  const startTime = optionalText(formData, 'startTime')
  const endTime = optionalText(formData, 'endTime')
  if (Boolean(startTime) !== Boolean(endTime)) {
    throw new Error('시작·종료 시각은 모두 입력하거나 모두 비워 주세요.')
  }
  const startDate = toEventInstant(text(formData, 'startDate'), startTime)
  const endDate = toEventInstant(text(formData, 'endDate'), endTime)
  if (endDate < startDate) {
    throw new Error('종료 일시가 시작 일시보다 앞설 수 없습니다.')
  }
  return { startDate, endDate, hasTime: Boolean(startTime) }
}

/**
 * 역할별 기관 ID 목록(쉼표 구분, 순서 = 표시 순서)을 연결 행으로 바꾼다.
 * 같은 역할에 같은 기관이 두 번 들어오면 한 번만 남긴다.
 */
function institutionLinks(formData: FormData) {
  return ROLE_ORDER.flatMap((role: BusinessRole) => {
    const ids = text(formData, `role_${role}`)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        const id = Number(value)
        if (!Number.isInteger(id) || id <= 0) {
          throw new Error('주최·주관·후원·협력 기관 선택이 올바르지 않습니다.')
        }
        return id
      })
    return [...new Set(ids)].map((institutionId, sortOrder) => ({
      institutionId,
      role,
      sortOrder,
    }))
  })
}

function businessData(formData: FormData) {
  return {
    name: text(formData, 'name'),
    code: text(formData, 'code'),
    slug: optionalSlug(formData),
    category: businessCategory(formData),
    ...eventPeriod(formData),
    location: optionalText(formData, 'location'),
    icon: optionalIcon(formData),
    coverImageId: optionalNumber(formData, 'coverImageId'),
    summary: optionalText(formData, 'summary'),
    content: text(formData, 'content'),
    notionId: optionalNotionId(formData),
  }
}

export async function createBusiness(formData: FormData) {
  await requireAdminActionSession()
  const data = businessData(formData)
  const links = institutionLinks(formData)
  await withMutationMessage(
    () =>
      prisma.business.create({
        data: { ...data, institutions: { create: links } },
      }),
    '사업',
  )
  revalidatePath('/admin')
}

export async function updateBusiness(formData: FormData) {
  await requireAdminActionSession()
  const data = businessData(formData)
  const links = institutionLinks(formData)
  await withMutationMessage(
    () =>
      prisma.business.update({
        where: { id: recordId(formData) },
        data: {
          ...data,
          // 연결은 폼에 보인 순서대로 통째로 바꾼다.
          institutions: { deleteMany: {}, create: links },
        },
      }),
    '사업',
  )
  revalidatePath('/admin')
}

function businessPageData(formData: FormData) {
  const path = text(formData, 'path')
  if (!isValidPagePath(path)) {
    throw new Error(
      '경로는 영문 소문자·숫자·하이픈으로 된 이름을 /로 이은 형태여야 합니다. 예: faq, notice/team-building',
    )
  }
  return {
    businessId: requiredNumber(formData, 'businessId'),
    path,
    title: text(formData, 'title'),
    icon: optionalIcon(formData),
    coverImageId: optionalNumber(formData, 'coverImageId'),
    content: text(formData, 'content'),
    notionId: optionalNotionId(formData),
  }
}

export async function createBusinessPage(formData: FormData) {
  await requireAdminActionSession()
  const data = businessPageData(formData)
  await withMutationMessage(
    () => prisma.businessPage.create({ data }),
    '행사 페이지',
  )
  revalidatePath('/admin')
}

export async function updateBusinessPage(formData: FormData) {
  await requireAdminActionSession()
  const data = businessPageData(formData)
  await withMutationMessage(
    () =>
      prisma.businessPage.update({
        where: { id: recordId(formData) },
        data,
      }),
    '행사 페이지',
  )
  revalidatePath('/admin')
}

export async function deleteBusinessPage(formData: FormData) {
  await requireAdminActionSession()
  await withDeleteMessage(
    () => prisma.businessPage.delete({ where: { id: recordId(formData) } }),
    '행사 페이지',
  )
  revalidatePath('/admin')
}

export async function createImageAsset(formData: FormData) {
  await requireAdminActionSession()
  const { file, url } = requiredUrlOrUpload(formData, 'file', 'url')
  const uploaded = file ? await uploadAsset(file, 'images') : null

  try {
    await withMutationMessage(
      () =>
        prisma.imageAsset.create({
          data: {
            alt: optionalText(formData, 'alt'),
            filename: uploaded?.filename ?? optionalText(formData, 'filename'),
            url: uploaded?.url ?? requireSafeImageUrl(url, '이미지 URL'),
            mimeType:
              uploaded?.mimeType ??
              optionalText(formData, 'mimeType') ??
              'image/*',
            prefix: uploaded?.prefix ?? 'images',
          },
        }),
      '이미지',
    )
  } catch (error) {
    if (uploaded?.url) {
      await deleteManagedAsset(uploaded.url)
    }
    throw error
  }

  revalidatePath('/admin')
}

export async function updateImageAsset(formData: FormData) {
  await requireAdminActionSession()
  const existing = await prisma.imageAsset.findUnique({
    where: { id: recordId(formData) },
  })
  const { file, url } = requiredUrlOrUpload(formData, 'file', 'url')
  const uploaded = file ? await uploadAsset(file, 'images') : null

  try {
    await withMutationMessage(
      () =>
        prisma.imageAsset.update({
          where: { id: recordId(formData) },
          data: {
            alt: optionalText(formData, 'alt'),
            filename: uploaded?.filename ?? optionalText(formData, 'filename'),
            url: uploaded?.url ?? requireSafeImageUrl(url, '이미지 URL'),
            mimeType:
              uploaded?.mimeType ??
              optionalText(formData, 'mimeType') ??
              'image/*',
            prefix: uploaded?.prefix ?? 'images',
          },
        }),
      '이미지',
    )
  } catch (error) {
    if (uploaded?.url) {
      await bestEffortDeleteManagedAsset(uploaded.url)
    }
    throw error
  }

  if (uploaded && existing?.url) {
    await maybeDeleteUnreferencedImage(existing.url, existing.id)
  }
  revalidatePath('/admin')
}

export async function createFileAsset(formData: FormData) {
  await requireAdminActionSession()
  const { file, url } = requiredUrlOrUpload(formData, 'file', 'url')
  const uploaded = file ? await uploadAsset(file, 'files') : null

  try {
    await withMutationMessage(
      () =>
        prisma.fileAsset.create({
          data: {
            filename: uploaded?.filename ?? text(formData, 'filename'),
            url: uploaded?.url ?? requireSafePdfUrl(url, '파일 URL'),
            mimeType:
              uploaded?.mimeType ??
              optionalText(formData, 'mimeType') ??
              'application/pdf',
            prefix: uploaded?.prefix ?? 'files',
          },
        }),
      '파일',
    )
  } catch (error) {
    if (uploaded?.url) {
      await deleteManagedAsset(uploaded.url)
    }
    throw error
  }

  revalidatePath('/admin')
}

export async function updateFileAsset(formData: FormData) {
  await requireAdminActionSession()
  const existing = await prisma.fileAsset.findUnique({
    where: { id: recordId(formData) },
  })
  const { file, url } = requiredUrlOrUpload(formData, 'file', 'url')
  const uploaded = file ? await uploadAsset(file, 'files') : null
  // 노션에서 옮긴 동영상처럼 PDF가 아닌 파일도 주소를 바꾸지 않으면 그대로 둔다.
  const keepsUrl = !uploaded && Boolean(existing?.url) && url === existing?.url

  try {
    await withMutationMessage(
      () =>
        prisma.fileAsset.update({
          where: { id: recordId(formData) },
          data: {
            filename: uploaded?.filename ?? text(formData, 'filename'),
            url:
              uploaded?.url ??
              (keepsUrl ? url : requireSafePdfUrl(url, '파일 URL')),
            mimeType:
              uploaded?.mimeType ??
              optionalText(formData, 'mimeType') ??
              (keepsUrl ? existing?.mimeType : null) ??
              'application/pdf',
            prefix: uploaded?.prefix ?? 'files',
          },
        }),
      '파일',
    )
  } catch (error) {
    if (uploaded?.url) {
      await bestEffortDeleteManagedAsset(uploaded.url)
    }
    throw error
  }

  if (uploaded && existing?.url) {
    await maybeDeleteUnreferencedFile(existing.url, existing.id)
  }
  revalidatePath('/admin')
}

/**
 * 기관. 행사 주최·후원 기관으로만 쓰는 곳은 이름만 있어도 된다. 홈 로고 흐름에는
 * '홈 노출'을 켜고 로고가 있는 기관만 나온다.
 */
function institutionData(formData: FormData) {
  const url = optionalText(formData, 'url')
  return {
    nameKo: text(formData, 'nameKo'),
    nameEn: optionalText(formData, 'nameEn'),
    url: url ? requireSafeHttpsUrl(url, '기관 URL') : null,
    logoId: optionalNumber(formData, 'logoId'),
    showOnHome: formData.get('showOnHome') === 'on',
  }
}

export async function createInstitution(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.institution.create({
        data: institutionData(formData),
      }),
    '기관',
  )
  revalidatePath('/admin')
}

export async function updateInstitution(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.institution.update({
        where: { id: recordId(formData) },
        data: institutionData(formData),
      }),
    '기관',
  )
  revalidatePath('/admin')
}

const MARKDOWN_TYPES: MarkdownType[] = [
  'articles',
  'privacy',
  'terms',
  'hackathon',
  'conference',
]

function markdownType(formData: FormData): MarkdownType {
  const value = text(formData, 'type')
  if (!MARKDOWN_TYPES.includes(value as MarkdownType)) {
    throw new Error('마크다운 유형이 올바르지 않습니다.')
  }
  return value as MarkdownType
}

export async function createMarkdown(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.markdown.create({
        data: {
          type: markdownType(formData),
          revisionDate: date(formData, 'revisionDate'),
          effectiveDate: date(formData, 'effectiveDate'),
          content: text(formData, 'content'),
        },
      }),
    '마크다운',
  )
  revalidatePath('/admin')
}

export async function updateMarkdown(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.markdown.update({
        where: { id: recordId(formData) },
        data: {
          type: markdownType(formData),
          revisionDate: date(formData, 'revisionDate'),
          effectiveDate: date(formData, 'effectiveDate'),
          content: text(formData, 'content'),
        },
      }),
    '마크다운',
  )
  revalidatePath('/admin')
}

/**
 * 뉴스 기사·블로그 후기는 연결된 행사의 분류에 따라 해커톤&아이디어톤 또는
 * 컨퍼런스&프로그램 아래에 보이므로 행사 연결이 필수다.
 */
function webpageTypeAndBusiness(formData: FormData) {
  const type = text(formData, 'type')
  if (!['blog_post', 'news_article', 'press_release'].includes(type)) {
    throw new Error('웹페이지 유형이 올바르지 않습니다.')
  }
  const businessId = optionalNumber(formData, 'businessId')
  if (type !== 'press_release' && !businessId) {
    throw new Error(
      '뉴스 기사와 블로그 포스트는 관련 행사(사업)를 선택해야 합니다.',
    )
  }
  return {
    type: type as 'blog_post' | 'news_article' | 'press_release',
    businessId,
  }
}

export async function createWebpage(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.webpage.create({
        data: {
          url: requireSafeHttpsUrl(text(formData, 'url'), '웹페이지 URL'),
          title: text(formData, 'title'),
          author: text(formData, 'author'),
          publishedDate: date(formData, 'publishedDate'),
          ...webpageTypeAndBusiness(formData),
        },
      }),
    '웹페이지',
  )
  revalidatePath('/admin')
}

export async function updateWebpage(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.webpage.update({
        where: { id: recordId(formData) },
        data: {
          url: requireSafeHttpsUrl(text(formData, 'url'), '웹페이지 URL'),
          title: text(formData, 'title'),
          author: text(formData, 'author'),
          publishedDate: date(formData, 'publishedDate'),
          ...webpageTypeAndBusiness(formData),
        },
      }),
    '웹페이지',
  )
  revalidatePath('/admin')
}

export async function createReport(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.report.create({
        data: {
          title: text(formData, 'title'),
          publishedDate: date(formData, 'publishedDate'),
          type: text(formData, 'type') as 'meeting' | 'donation',
          fileId: requiredNumber(formData, 'fileId'),
        },
      }),
    '보고서',
  )
  revalidatePath('/admin')
}

export async function updateReport(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.report.update({
        where: { id: recordId(formData) },
        data: {
          title: text(formData, 'title'),
          publishedDate: date(formData, 'publishedDate'),
          type: text(formData, 'type') as 'meeting' | 'donation',
          fileId: requiredNumber(formData, 'fileId'),
        },
      }),
    '보고서',
  )
  revalidatePath('/admin')
}

export async function createHistory(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.history.create({
        data: {
          date: date(formData, 'date'),
          title: text(formData, 'title'),
          content: optionalText(formData, 'content'),
          imageId: optionalNumber(formData, 'imageId'),
        },
      }),
    '연혁',
  )
  revalidatePath('/admin')
}

export async function updateHistory(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.history.update({
        where: { id: recordId(formData) },
        data: {
          date: date(formData, 'date'),
          title: text(formData, 'title'),
          content: optionalText(formData, 'content'),
          imageId: optionalNumber(formData, 'imageId'),
        },
      }),
    '연혁',
  )
  revalidatePath('/admin')
}

export async function deleteBusiness(formData: FormData) {
  await requireAdminActionSession()
  await withDeleteMessage(
    () => prisma.business.delete({ where: { id: recordId(formData) } }),
    '사업',
  )
  revalidatePath('/admin')
}

export async function deleteImageAsset(formData: FormData) {
  await requireAdminActionSession()
  const existing = await prisma.imageAsset.findUnique({
    where: { id: recordId(formData) },
  })
  if (existing?.url && (await countContentReferences(existing.url)) > 0) {
    throw new Error(
      '이미지 항목이 행사 본문이나 소개 글에서 사용 중이어서 삭제할 수 없습니다. 본문에서 이미지 주소를 먼저 지워주세요.',
    )
  }
  await withDeleteMessage(
    () => prisma.imageAsset.delete({ where: { id: recordId(formData) } }),
    '이미지',
  )
  await maybeDeleteUnreferencedImage(existing?.url)
  revalidatePath('/admin')
}

export async function deleteFileAsset(formData: FormData) {
  await requireAdminActionSession()
  const existing = await prisma.fileAsset.findUnique({
    where: { id: recordId(formData) },
  })
  if (existing?.url && (await countContentReferences(existing.url)) > 0) {
    throw new Error(
      '파일 항목이 행사 본문이나 소개 글에서 사용 중이어서 삭제할 수 없습니다. 본문에서 파일 주소를 먼저 지워주세요.',
    )
  }
  await withDeleteMessage(
    () => prisma.fileAsset.delete({ where: { id: recordId(formData) } }),
    '파일',
  )
  await maybeDeleteUnreferencedFile(existing?.url)
  revalidatePath('/admin')
}

export async function deleteInstitution(formData: FormData) {
  await requireAdminActionSession()
  await withDeleteMessage(
    () => prisma.institution.delete({ where: { id: recordId(formData) } }),
    '기관',
  )
  revalidatePath('/admin')
}

export async function deleteMarkdown(formData: FormData) {
  await requireAdminActionSession()
  await withDeleteMessage(
    () => prisma.markdown.delete({ where: { id: recordId(formData) } }),
    '마크다운',
  )
  revalidatePath('/admin')
}

export async function deleteWebpage(formData: FormData) {
  await requireAdminActionSession()
  await withDeleteMessage(
    () => prisma.webpage.delete({ where: { id: recordId(formData) } }),
    '웹페이지',
  )
  revalidatePath('/admin')
}

export async function deleteReport(formData: FormData) {
  await requireAdminActionSession()
  await withDeleteMessage(
    () => prisma.report.delete({ where: { id: recordId(formData) } }),
    '보고서',
  )
  revalidatePath('/admin')
}

export async function deleteHistory(formData: FormData) {
  await requireAdminActionSession()
  await withDeleteMessage(
    () => prisma.history.delete({ where: { id: recordId(formData) } }),
    '연혁',
  )
  revalidatePath('/admin')
}

export async function createAdminSetting(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.adminSettings.create({
        data: {
          key: text(formData, 'key'),
          value: text(formData, 'value'),
        },
      }),
    '설정',
  )
  revalidatePath('/admin/settings')
}

export async function updateAdminSetting(formData: FormData) {
  await requireAdminActionSession()
  const newValue = text(formData, 'value')
  if (newValue.length > 0) {
    await withMutationMessage(
      () =>
        prisma.adminSettings.update({
          where: { id: recordId(formData) },
          data: { value: newValue },
        }),
      '설정',
    )
  }
  revalidatePath('/admin/settings')
}

export async function deleteAdminSetting(formData: FormData) {
  await requireAdminActionSession()
  await withDeleteMessage(
    () => prisma.adminSettings.delete({ where: { id: recordId(formData) } }),
    '설정',
  )
  revalidatePath('/admin/settings')
}

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

  if (count === 0) {
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

  if (count === 0) {
    await bestEffortDeleteManagedAsset(url)
  }
}

function uploadedFile(formData: FormData, key: string) {
  const value = formData.get(key)
  if (!(value instanceof File) || value.size === 0) {
    return null
  }
  return value
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

export async function createBusiness(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.business.create({
        data: {
          name: text(formData, 'name'),
          code: text(formData, 'code'),
          startDate: date(formData, 'startDate'),
          endDate: date(formData, 'endDate'),
          location: optionalText(formData, 'location'),
        },
      }),
    '사업',
  )
  revalidatePath('/admin')
}

export async function updateBusiness(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.business.update({
        where: { id: recordId(formData) },
        data: {
          name: text(formData, 'name'),
          code: text(formData, 'code'),
          startDate: date(formData, 'startDate'),
          endDate: date(formData, 'endDate'),
          location: optionalText(formData, 'location'),
        },
      }),
    '사업',
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

  try {
    await withMutationMessage(
      () =>
        prisma.fileAsset.update({
          where: { id: recordId(formData) },
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
      await bestEffortDeleteManagedAsset(uploaded.url)
    }
    throw error
  }

  if (uploaded && existing?.url) {
    await maybeDeleteUnreferencedFile(existing.url, existing.id)
  }
  revalidatePath('/admin')
}

export async function createInstitution(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.institution.create({
        data: {
          nameKo: text(formData, 'nameKo'),
          nameEn: text(formData, 'nameEn'),
          url: requireSafeHttpsUrl(text(formData, 'url'), '기관 URL'),
          logoId: requiredNumber(formData, 'logoId'),
        },
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
        data: {
          nameKo: text(formData, 'nameKo'),
          nameEn: text(formData, 'nameEn'),
          url: requireSafeHttpsUrl(text(formData, 'url'), '기관 URL'),
          logoId: requiredNumber(formData, 'logoId'),
        },
      }),
    '기관',
  )
  revalidatePath('/admin')
}

export async function createMarkdown(formData: FormData) {
  await requireAdminActionSession()
  await withMutationMessage(
    () =>
      prisma.markdown.create({
        data: {
          type: text(formData, 'type') as 'articles' | 'privacy' | 'terms',
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
          type: text(formData, 'type') as 'articles' | 'privacy' | 'terms',
          revisionDate: date(formData, 'revisionDate'),
          effectiveDate: date(formData, 'effectiveDate'),
          content: text(formData, 'content'),
        },
      }),
    '마크다운',
  )
  revalidatePath('/admin')
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
          businessId: optionalNumber(formData, 'businessId'),
          type: text(formData, 'type') as
            | 'blog_post'
            | 'news_article'
            | 'press_release',
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
          businessId: optionalNumber(formData, 'businessId'),
          type: text(formData, 'type') as
            | 'blog_post'
            | 'news_article'
            | 'press_release',
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

'use server'

import { prisma } from '@/utils/prisma'
import type { MarkdownType, ReportType, WebpageType } from '@/utils/cms-types'
import {
  isAllowedImageUrl,
  isSafeHttpsUrl,
  isSafePdfUrl,
  toPublicAssetUrl,
} from '@/utils/public-url'

export async function queryInstitutions() {
  const institutions = await prisma.institution.findMany({
    include: {
      logo: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  return institutions.flatMap(({ logo }) =>
    isAllowedImageUrl(logo.url)
      ? [{ imageUrl: toPublicAssetUrl(logo.url), imageAlt: logo.alt }]
      : [],
  )
}

export async function queryWebpages(type: WebpageType) {
  const webpages = await prisma.webpage.findMany({
    where: {
      type,
    },
    include: {
      business: true,
    },
    orderBy: {
      publishedDate: 'desc',
    },
  })

  return webpages
    .filter((webpage) => isSafeHttpsUrl(webpage.url))
    .map((webpage) => ({
      id: webpage.id,
      title: webpage.title,
      author: webpage.author,
      url: webpage.url,
      publishedDate: webpage.publishedDate,
      business_name: webpage.business?.name ?? '',
    }))
}

export async function queryReports(type: ReportType) {
  const reports = await prisma.report.findMany({
    where: {
      type,
    },
    include: {
      file: true,
    },
    orderBy: {
      publishedDate: 'desc',
    },
  })

  return reports
    .filter((report) => isSafePdfUrl(report.file.url))
    .map((report) => ({
      id: report.id,
      title: report.title,
      publishedDate: report.publishedDate,
      file_url: toPublicAssetUrl(report.file.url ?? ''),
    }))
}

export async function getMarkdownsByType(type: MarkdownType) {
  return prisma.markdown.findMany({
    where: {
      type,
    },
    orderBy: {
      effectiveDate: 'desc',
    },
  })
}

export async function getLatestMarkdownByType(type: MarkdownType) {
  return prisma.markdown.findFirst({
    where: {
      type,
    },
    orderBy: {
      effectiveDate: 'desc',
    },
  })
}

export async function queryHistories() {
  const histories = await prisma.history.findMany({
    include: {
      image: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  return histories.map((history) => ({
    id: history.id,
    date: history.date,
    title: history.title,
    content: history.content,
    imageUrl:
      history.image && isAllowedImageUrl(history.image.url)
        ? toPublicAssetUrl(history.image.url)
        : null,
    imageAlt: history.image?.alt ?? null,
  }))
}

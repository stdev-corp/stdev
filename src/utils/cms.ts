'use server'

import { prisma } from '@/utils/prisma'
import type {
  BusinessCategory,
  BusinessRole,
  EventDetail,
  EventDocument,
  EventPageCrumb,
  EventRoleGroup,
  EventSummary,
  MarkdownType,
  NotionPageLinks,
  ReportType,
  WebpageType,
} from '@/utils/cms-types'
import {
  EVENT_SECTIONS,
  eventHref,
  eventPageHref,
  normalizeNotionId,
  ROLE_LABELS,
  ROLE_ORDER,
  sectionOfCategory,
  type EventSection,
} from '@/utils/events'
import { collectPageRefs, pageLinkKey } from '@/utils/notion-markdown'
import {
  isAllowedImageUrl,
  isSafeHttpsUrl,
  isSafePdfUrl,
  toPublicAssetUrl,
} from '@/utils/public-url'

export async function queryInstitutions() {
  const institutions = await prisma.institution.findMany({
    where: {
      showOnHome: true,
    },
    include: {
      logo: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  // 행사 주최·후원 기관으로만 등록되어 로고가 없는 기관은 흐름에서 뺀다.
  return institutions.flatMap(({ logo }) =>
    logo && isAllowedImageUrl(logo.url)
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

/* ------------------------------------------------------------------ *
 * 행사 (해커톤&아이디어톤, 컨퍼런스&프로그램)
 * ------------------------------------------------------------------ */

const eventInclude = {
  institutions: {
    include: { institution: true },
    orderBy: [{ role: 'asc' as const }, { sortOrder: 'asc' as const }],
  },
}

type EventRecord = {
  id: number
  name: string
  slug: string | null
  category: BusinessCategory
  startDate: Date
  endDate: Date
  hasTime: boolean
  location: string | null
  summary: string | null
  institutions: {
    role: BusinessRole
    sortOrder: number
    institution: { nameKo: string; url: string | null }
  }[]
}

function toRoleGroups(links: EventRecord['institutions']): EventRoleGroup[] {
  return ROLE_ORDER.flatMap((role) => {
    const organizations = links
      .filter((link) => link.role === role)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((link) => ({
        name: link.institution.nameKo,
        url: isSafeHttpsUrl(link.institution.url) ? link.institution.url : null,
      }))
    return organizations.length > 0
      ? [{ role, label: ROLE_LABELS[role], organizations }]
      : []
  })
}

function toEventSummary(business: EventRecord): EventSummary {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    category: business.category,
    href: business.slug ? eventHref(business.category, business.slug) : null,
    startDate: business.startDate,
    endDate: business.endDate,
    hasTime: business.hasTime,
    location: business.location,
    summary: business.summary,
    roles: toRoleGroups(business.institutions),
  }
}

function coverUrl(image: { url: string | null } | null | undefined) {
  return image && isAllowedImageUrl(image.url)
    ? toPublicAssetUrl(image.url)
    : null
}

/** 구역의 행사 목록. 개최일(시작일) 내림차순. */
export async function queryEvents(section: EventSection) {
  const businesses = await prisma.business.findMany({
    where: { category: { in: EVENT_SECTIONS[section].categories } },
    include: eventInclude,
    orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
  })
  return businesses.map(toEventSummary)
}

/** 구역 소개 마크다운(가장 최근 시행본). */
export async function getSectionIntro(section: EventSection) {
  const markdown = await getLatestMarkdownByType(section)
  return markdown?.content ?? null
}

/**
 * 본문의 ::page 지시어가 가리키는 페이지들을 찾아 주소와 제목을 붙인다.
 * 같은 행사의 하위 페이지는 path로, 다른 행사는 event(슬러그)로 가리킨다.
 */
async function resolvePageLinks(
  current: {
    id: number
    slug: string
    category: BusinessCategory
    name: string
    icon: string | null
  },
  content: string,
): Promise<NotionPageLinks> {
  const refs = collectPageRefs(content)
  if (refs.length === 0) {
    return {}
  }

  const otherSlugs = [
    ...new Set(
      refs
        .map((ref) => ref.event)
        .filter(
          (slug): slug is string => Boolean(slug) && slug !== current.slug,
        ),
    ),
  ]
  const others =
    otherSlugs.length > 0
      ? await prisma.business.findMany({
          where: { slug: { in: otherSlugs } },
          select: {
            id: true,
            slug: true,
            category: true,
            name: true,
            icon: true,
          },
        })
      : []
  const events = [current, ...others]
  const pages = await prisma.businessPage.findMany({
    where: { businessId: { in: events.map((event) => event.id) } },
    select: { businessId: true, path: true, title: true, icon: true },
  })

  const links: NotionPageLinks = {}
  for (const ref of refs) {
    const event = ref.event
      ? events.find((candidate) => candidate.slug === ref.event)
      : events[0]
    if (!event?.slug) {
      continue
    }
    const key = pageLinkKey(ref.event, ref.path)
    if (!ref.path) {
      links[key] = {
        href: eventHref(event.category, event.slug),
        title: event.name,
        icon: event.icon,
      }
      continue
    }
    const page = pages.find(
      (candidate) =>
        candidate.businessId === event.id && candidate.path === ref.path,
    )
    if (page) {
      links[key] = {
        href: eventPageHref(event.category, event.slug, page.path),
        title: page.title,
        icon: page.icon,
      }
    }
  }
  return links
}

/**
 * 관리자 미리보기: 편집 중인 본문의 ::page 링크를 지금 DB 기준으로 푼다. 행사가
 * 아직 없거나 슬러그가 없으면 다른 행사를 가리키는 링크(event=…)만 풀린다.
 */
export async function resolvePreviewPageLinks(
  businessId: number | null,
  content: string,
): Promise<NotionPageLinks> {
  const business = businessId
    ? await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          slug: true,
          category: true,
          name: true,
          icon: true,
        },
      })
    : null
  return resolvePageLinks(
    business?.slug
      ? { ...business, slug: business.slug }
      : { id: -1, slug: '', category: 'hackathon', name: '', icon: null },
    content,
  )
}

export type EventLookup<T> =
  | { kind: 'found'; value: T }
  | { kind: 'redirect'; href: string }
  | { kind: 'missing' }

/** 옛 노션 페이지 ID로 들어온 주소를 새 주소로 바꾼다. */
export async function findNotionRedirect(
  value: string,
): Promise<string | null> {
  const notionId = normalizeNotionId(value)
  if (!notionId) {
    return null
  }
  const business = await prisma.business.findUnique({
    where: { notionId },
    select: { slug: true, category: true },
  })
  if (business?.slug) {
    return eventHref(business.category, business.slug)
  }
  const page = await prisma.businessPage.findUnique({
    where: { notionId },
    select: {
      path: true,
      business: { select: { slug: true, category: true } },
    },
  })
  if (page?.business.slug) {
    return eventPageHref(page.business.category, page.business.slug, page.path)
  }
  return null
}

/** 행사 페이지. 다른 구역의 행사이거나 옛 노션 주소면 넘길 곳을 알려 준다. */
export async function getEventDetail(
  section: EventSection,
  slug: string,
): Promise<EventLookup<EventDetail>> {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: { ...eventInclude, coverImage: true },
  })

  if (!business?.slug) {
    const redirect = await findNotionRedirect(slug)
    return redirect ? { kind: 'redirect', href: redirect } : { kind: 'missing' }
  }
  if (sectionOfCategory(business.category) !== section) {
    return {
      kind: 'redirect',
      href: eventHref(business.category, business.slug),
    }
  }

  const event = toEventSummary(business)
  return {
    kind: 'found',
    value: {
      event,
      title: business.name,
      icon: business.icon,
      coverImageUrl: coverUrl(business.coverImage),
      content: business.content,
      pageLinks: await resolvePageLinks(
        {
          id: business.id,
          slug: business.slug,
          category: business.category,
          name: business.name,
          icon: business.icon,
        },
        business.content,
      ),
      ancestors: [],
    },
  }
}

/** 행사의 하위 페이지. path는 'notice/team-building'처럼 '/'로 이은 경로. */
export async function getEventPage(
  section: EventSection,
  slug: string,
  segments: string[],
): Promise<EventLookup<EventDocument>> {
  const path = segments.join('/')
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, category: true, icon: true },
  })
  if (!business?.slug) {
    return { kind: 'missing' }
  }
  if (sectionOfCategory(business.category) !== section) {
    return {
      kind: 'redirect',
      href: eventPageHref(business.category, business.slug, path),
    }
  }

  const page = await prisma.businessPage.findUnique({
    where: { businessId_path: { businessId: business.id, path } },
    include: { coverImage: true },
  })
  if (!page) {
    return { kind: 'missing' }
  }

  // 상위 경로(notice/team-building이면 notice)의 제목을 브레드크럼에 쓴다.
  const parentPaths = segments
    .slice(0, -1)
    .map((_, index) => segments.slice(0, index + 1).join('/'))
  const parents =
    parentPaths.length > 0
      ? await prisma.businessPage.findMany({
          where: { businessId: business.id, path: { in: parentPaths } },
          select: { path: true, title: true },
        })
      : []
  const ancestors: EventPageCrumb[] = [
    { label: business.name, href: eventHref(business.category, business.slug) },
    ...parentPaths.flatMap((parentPath) => {
      const parent = parents.find((candidate) => candidate.path === parentPath)
      return parent
        ? [
            {
              label: parent.title,
              href: eventPageHref(
                business.category,
                business.slug!,
                parentPath,
              ),
            },
          ]
        : []
    }),
  ]

  return {
    kind: 'found',
    value: {
      title: page.title,
      icon: page.icon,
      coverImageUrl: coverUrl(page.coverImage),
      content: page.content,
      pageLinks: await resolvePageLinks(
        {
          id: business.id,
          slug: business.slug,
          category: business.category,
          name: business.name,
          icon: business.icon,
        },
        page.content,
      ),
      ancestors,
    },
  }
}

/** 구역에 속한 행사에 연결된 뉴스 기사·참여후기. 행사에 연결되지 않은 글은 뺀다. */
export async function queryEventWebpages(
  type: Extract<WebpageType, 'news_article' | 'blog_post'>,
  section: EventSection,
) {
  const webpages = await prisma.webpage.findMany({
    where: {
      type,
      business: { category: { in: EVENT_SECTIONS[section].categories } },
    },
    include: { business: true },
    orderBy: { publishedDate: 'desc' },
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

/** 사이트맵에 올릴 행사·하위 페이지 주소. */
export async function queryEventSitemapPaths() {
  const businesses = await prisma.business.findMany({
    where: { slug: { not: null } },
    select: {
      slug: true,
      category: true,
      updatedAt: true,
      pages: { select: { path: true, updatedAt: true } },
    },
  })
  return businesses.flatMap((business) => [
    {
      path: eventHref(business.category, business.slug!),
      lastModified: business.updatedAt,
    },
    ...business.pages.map((page) => ({
      path: eventPageHref(business.category, business.slug!, page.path),
      lastModified: page.updatedAt,
    })),
  ])
}

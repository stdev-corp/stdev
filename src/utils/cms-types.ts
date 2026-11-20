export type MarkdownType =
  'articles' | 'privacy' | 'terms' | 'hackathon' | 'conference'
export type BusinessCategory =
  'hackathon' | 'ideathon' | 'conference' | 'program'
export type BusinessRole = 'host' | 'organizer' | 'sponsor' | 'partner'
export type ReportType = 'meeting' | 'donation'
export type WebpageType = 'blog_post' | 'news_article' | 'press_release'

export type InstitutionLogo = {
  imageUrl: string | null
  imageAlt: string | null
}

export type WebpageWithBusiness = {
  id: number
  title: string
  author: string
  url: string
  publishedDate: Date
  business_name: string
}

export type ReportWithFile = {
  id: number
  title: string
  publishedDate: Date
  file_url: string
}

export type MarkdownDocument = {
  id: number
  type: MarkdownType
  revisionDate: Date
  effectiveDate: Date
  content: string
}

export type HistoryEntry = {
  id: number
  date: Date
  title: string
  content: string | null
  imageUrl: string | null
  imageAlt: string | null
}

export type EventOrganization = {
  name: string
  url: string | null
}

export type EventRoleGroup = {
  role: BusinessRole
  label: string
  organizations: EventOrganization[]
}

export type EventSummary = {
  id: number
  name: string
  slug: string | null
  category: BusinessCategory
  /** 행사 페이지 주소. 슬러그가 없으면 null. */
  href: string | null
  startDate: Date
  endDate: Date
  hasTime: boolean
  location: string | null
  summary: string | null
  roles: EventRoleGroup[]
}

export type NotionPageLink = {
  href: string
  title: string
  icon: string | null
}

/** 노션 본문의 ::page 지시어를 실제 주소/제목으로 바꾸는 표. */
export type NotionPageLinks = Record<string, NotionPageLink>

export type EventPageCrumb = {
  label: string
  href: string
}

export type EventDocument = {
  /** 행사 자체 또는 하위 페이지의 제목 */
  title: string
  icon: string | null
  coverImageUrl: string | null
  content: string
  pageLinks: NotionPageLinks
  /** 브레드크럼에서 '행사 소개' 다음에 이어지는 상위 항목들 */
  ancestors: EventPageCrumb[]
}

export type EventDetail = EventDocument & {
  event: EventSummary
}

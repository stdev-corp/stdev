export type MarkdownType = 'articles' | 'privacy' | 'terms'
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

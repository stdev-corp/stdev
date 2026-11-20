import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'
import Breadcrumb from '@/components/krds/breadcrumb'
import PageTitle from '@/components/krds/page-title'
import MarkdownView from '@/components/markdown/markdown-view'
import NotionMarkdown from '@/components/notion/notion-markdown'
import NotionPage from '@/components/notion/notion-page'
import EventList from '@/components/events/event-list'
import EventOverview from '@/components/events/event-overview'
import WebpageList from '@/components/webpage-list'
import {
  getEventDetail,
  getEventPage,
  getSectionIntro,
  queryEventWebpages,
  queryEvents,
  type EventLookup,
} from '@/utils/cms'
import { EVENT_SECTIONS, type EventSection } from '@/utils/events'

// generateMetadata와 페이지가 같은 요청에서 한 번만 조회하도록 묶는다.
const loadEventDetail = cache(getEventDetail)
const loadEventPage = cache(
  (section: EventSection, slug: string, path: string) =>
    getEventPage(section, slug, path.split('/')),
)

function pageTitle(title: string): Metadata {
  return { title: `${title} | STDev Corp.` }
}

export async function eventDetailMetadata(
  section: EventSection,
  slug: string,
): Promise<Metadata> {
  const lookup = await loadEventDetail(section, slug)
  return lookup.kind === 'found' ? pageTitle(lookup.value.title) : {}
}

export async function eventPageMetadata(
  section: EventSection,
  slug: string,
  path: string[],
): Promise<Metadata> {
  const lookup = await loadEventPage(section, slug, path.join('/'))
  return lookup.kind === 'found' ? pageTitle(lookup.value.title) : {}
}

function unwrap<T>(lookup: EventLookup<T>): T {
  if (lookup.kind === 'redirect') {
    permanentRedirect(lookup.href)
  }
  if (lookup.kind === 'missing') {
    notFound()
  }
  return lookup.value
}

/** /hackathon, /conference: 구역 소개와 행사 목록 */
export async function EventSectionView({ section }: { section: EventSection }) {
  const [intro, events] = await Promise.all([
    getSectionIntro(section),
    queryEvents(section),
  ])
  const { label } = EVENT_SECTIONS[section]

  return (
    <>
      <Breadcrumb />
      <PageTitle title={label} />
      <div className="conts-area">
        {intro && (
          <div className="g-conts-area">
            <MarkdownView content={intro} titleLine />
          </div>
        )}
        <div className="g-conts-area">
          <h2 className="g-tit-line">STDev가 진행해온 {label}</h2>
          <EventList events={events} />
        </div>
      </div>
    </>
  )
}

const WEBPAGE_TITLES = {
  news_article: '뉴스 기사',
  blog_post: '참가자 블로그 후기',
} as const

/** /hackathon/news 등: 구역 행사에 연결된 기사·후기 */
export async function EventWebpagesView({
  section,
  type,
}: {
  section: EventSection
  type: keyof typeof WEBPAGE_TITLES
}) {
  const webpages = await queryEventWebpages(type, section)

  return (
    <>
      <Breadcrumb />
      <PageTitle title={WEBPAGE_TITLES[type]} />
      <div className="conts-area">
        <div className="g-conts-area">
          <WebpageList webpages={webpages} />
        </div>
      </div>
    </>
  )
}

/** /hackathon/[slug]: 행사 페이지 */
export async function EventDetailView({
  section,
  slug,
}: {
  section: EventSection
  slug: string
}) {
  const detail = unwrap(await loadEventDetail(section, slug))

  return (
    <>
      <Breadcrumb trail={[{ label: detail.title }]} />
      <NotionPage
        title={detail.title}
        icon={detail.icon}
        coverImageUrl={detail.coverImageUrl}
      >
        <EventOverview event={detail.event} />
        <NotionMarkdown content={detail.content} pageLinks={detail.pageLinks} />
      </NotionPage>
    </>
  )
}

/** /hackathon/[slug]/[...path]: 행사의 하위 페이지 */
export async function EventPageView({
  section,
  slug,
  path,
}: {
  section: EventSection
  slug: string
  path: string[]
}) {
  const page = unwrap(await loadEventPage(section, slug, path.join('/')))

  return (
    <>
      <Breadcrumb trail={[...page.ancestors, { label: page.title }]} />
      <NotionPage
        title={page.title}
        icon={page.icon}
        coverImageUrl={page.coverImageUrl}
      >
        <NotionMarkdown content={page.content} pageLinks={page.pageLinks} />
      </NotionPage>
    </>
  )
}

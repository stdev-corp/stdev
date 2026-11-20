import type { Metadata } from 'next'
import {
  EventPageView,
  eventPageMetadata,
} from '@/components/events/event-views'

type Props = {
  params: Promise<{ slug: string; path: string[] }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, path } = await props.params
  return eventPageMetadata('hackathon', slug, path)
}

export default async function HackathonEventSubPage(props: Props) {
  const { slug, path } = await props.params
  return <EventPageView section="hackathon" slug={slug} path={path} />
}

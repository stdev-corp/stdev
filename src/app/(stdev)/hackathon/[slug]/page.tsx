import type { Metadata } from 'next'
import {
  EventDetailView,
  eventDetailMetadata,
} from '@/components/events/event-views'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  return eventDetailMetadata('hackathon', slug)
}

export default async function HackathonEventPage(props: Props) {
  const { slug } = await props.params
  return <EventDetailView section="hackathon" slug={slug} />
}

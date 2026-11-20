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
  return eventDetailMetadata('conference', slug)
}

export default async function ConferenceEventPage(props: Props) {
  const { slug } = await props.params
  return <EventDetailView section="conference" slug={slug} />
}

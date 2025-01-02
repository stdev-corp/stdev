import { getUrlBySlug } from '@/utils/server/redirect'
import { logUrlEvent } from '@/utils/server/url-event'
import { redirect } from 'next/navigation'
import { after } from 'next/server'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ua: string }>
}

export default async function RedirectPage(props: Props) {
  const { slug } = await props.params
  const { ua } = await props.searchParams

  const url = await getUrlBySlug(slug)

  if (!url) {
    return <div>존재하지 않는 URL입니다.</div>
  }

  after(() => logUrlEvent(slug, JSON.parse(ua)))

  redirect(url)
}

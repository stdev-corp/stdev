import { Button } from '@nextui-org/button'
import Link from 'next/link'
import { Links } from '@/utils/links'
import RedirectTable from './table'
import { listRedirectsWithUser } from '@/utils/server/redirect'

export const dynamic = 'force-dynamic'

export default async function AdminMarkdownsPage() {
  const data = await listRedirectsWithUser()

  return (
    <>
      <h1 className="text-xl mb-8">단축 URL</h1>
      <Button as={Link} href={Links.adminRedirectCreate}>
        새로 만들기
      </Button>
      <div className="h-4" />
      <RedirectTable redirects={data} />
    </>
  )
}

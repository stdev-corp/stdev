import { getMarkdowns } from '@/utils/server/markdown'
import MarkdownsTable from './table'
import { Button } from '@nextui-org/button'
import Link from 'next/link'
import { Links } from '@/utils/links'

export const dynamic = 'force-dynamic'

export default async function AdminMarkdownsPage() {
  const data = await getMarkdowns()

  return (
    <>
      <h1>마크다운</h1>
      <Button as={Link} href={Links.adminMarkdownCreate}>
        새로 만들기
      </Button>
      <div className="h-4" />
      <MarkdownsTable markdowns={data} />
    </>
  )
}

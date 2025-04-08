import { queryWebpages } from '@/utils/server/webpage'
import { Button } from '@heroui/button'
import WebpageTable from './table'
import Link from 'next/link'
import { Links } from '@/utils/links'

export default async function AdminWebpagePage() {
  const webpages = await queryWebpages()

  return (
    <>
      <h1>웹페이지 관리</h1>
      <Button as={Link} href={Links.adminWebpageCreate}>
        새 웹페이지 추가
      </Button>
      <div className="h-8" />
      <WebpageTable webpages={webpages} />
    </>
  )
}

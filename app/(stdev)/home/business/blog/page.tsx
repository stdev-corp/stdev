import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/server/webpage'
import { WebpageType } from '@prisma/client'

export default async function BlogPage() {
  const webpages = await queryWebpages(WebpageType.BLOG_POST)

  return (
    <div>
      <h1>참가자 블로그 후기</h1>
      <WebpageList webpages={webpages} />
    </div>
  )
}

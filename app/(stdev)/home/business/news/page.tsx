import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/server/webpage'
import { WebpageType } from '@prisma/client'

export default async function NewsPage() {
  const webpages = await queryWebpages(WebpageType.NEWS_ARTICLE)

  return (
    <div>
      <h1>뉴스 기사</h1>
      <WebpageList webpages={webpages} />
    </div>
  )
}

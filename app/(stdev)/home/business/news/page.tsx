import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/payload'

export default async function NewsPage() {
  const webpages = await queryWebpages('news_article')

  return (
    <div>
      <h1>뉴스 기사</h1>
      <WebpageList webpages={webpages} />
    </div>
  )
}

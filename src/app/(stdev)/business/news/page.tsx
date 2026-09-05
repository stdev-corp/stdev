import PageTitle from '@/components/krds/page-title'
import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/cms'

export default async function NewsPage() {
  const webpages = await queryWebpages('news_article')

  return (
    <>
      <PageTitle title="뉴스 기사" />
      <div className="conts-area">
        <div className="g-conts-area">
          <WebpageList webpages={webpages} />
        </div>
      </div>
    </>
  )
}

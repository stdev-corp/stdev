import PageTitle from '@/components/krds/page-title'
import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/cms'

export default async function BlogPage() {
  const webpages = await queryWebpages('blog_post')

  return (
    <>
      <PageTitle title="참가자 블로그 후기" />
      <div className="conts-area">
        <div className="g-conts-area">
          <WebpageList webpages={webpages} />
        </div>
      </div>
    </>
  )
}

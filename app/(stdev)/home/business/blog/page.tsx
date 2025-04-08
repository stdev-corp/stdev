import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/payload'

export default async function BlogPage() {
  const webpages = await queryWebpages('blog_post')

  return (
    <div>
      <h1>참가자 블로그 후기</h1>
      <WebpageList webpages={webpages} />
    </div>
  )
}

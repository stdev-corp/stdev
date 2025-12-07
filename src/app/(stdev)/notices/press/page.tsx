import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/payload'

export default async function PressPage() {
  const webpages = await queryWebpages('press_release')

  return (
    <div>
      <h1>보도자료</h1>
      <WebpageList webpages={webpages} />
    </div>
  )
}

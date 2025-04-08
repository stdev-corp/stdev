import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/server/webpage'
import { WebpageType } from '@prisma/client'

export default async function PressPage() {
  const webpages = await queryWebpages(WebpageType.PRESS_RELEASE)

  return (
    <div>
      <h1>보도자료</h1>
      <WebpageList webpages={webpages} />
    </div>
  )
}

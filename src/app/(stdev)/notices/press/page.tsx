import PageTitle from '@/components/krds/page-title'
import WebpageList from '@/components/webpage-list'
import { queryWebpages } from '@/utils/cms'

export default async function PressPage() {
  const webpages = await queryWebpages('press_release')

  return (
    <>
      <PageTitle title="보도자료" />
      <div className="conts-area">
        <div className="g-conts-area">
          <WebpageList webpages={webpages} />
        </div>
      </div>
    </>
  )
}

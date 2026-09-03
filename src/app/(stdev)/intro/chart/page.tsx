import Image from 'next/image'
import PageTitle from '@/components/krds/page-title'

export default async function ChartPage() {
  return (
    <>
      <PageTitle title="조직도" />
      <div className="conts-area">
        <div className="g-conts-area">
          <div className="g-img-wrap">
            <Image
              src="/images/intro/chart.png"
              alt="사단법인 에스티데브 조직도"
              width={3112}
              height={2540}
              sizes="(max-width: 832px) calc(100vw - 32px), 800px"
              style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

import { queryInstitutions } from '@/utils/cms'
import NextImage from 'next/image'
import MainLayout from '@/components/krds/main-layout'
import ScrollingLogos from '@/components/scrolling-logos'

export default async function Page() {
  const institutions = await queryInstitutions()

  return (
    <MainLayout>
      <h1 className="sr-only">사단법인 STDev</h1>

      <section className="main-visual">
        <div className="inner">
          <NextImage
            src="/images/intro/title.png"
            alt="STDev - 개발자를 위한 커뮤니티를 만듭니다"
            width={4960}
            height={844}
            sizes="(max-width: 672px) calc(100vw - 32px), 600px"
            loading="eager"
            fetchPriority="high"
            style={{ width: '100%', maxWidth: '600px', height: 'auto' }}
          />
        </div>
      </section>

      <section className="main-section">
        <div className="inner">
          <h2 className="section-tit">STDev는 이렇게 일합니다</h2>
          <NextImage
            src="/images/intro/3w1h.png"
            alt="STDev의 What, Why, Who, How 소개"
            width={6672}
            height={3160}
            sizes="(max-width: 832px) calc(100vw - 32px), 800px"
            loading="eager"
            style={{
              display: 'block',
              margin: '0 auto',
              width: '100%',
              maxWidth: '800px',
              height: 'auto',
            }}
          />
        </div>
      </section>

      <section className="main-section">
        <div className="inner">
          <h2 className="section-tit">함께하는 기관</h2>
          <ScrollingLogos institutions={institutions} />
        </div>
      </section>
    </MainLayout>
  )
}

import Image from 'next/image'
import PageTitle from '@/components/krds/page-title'

export default function ConferencePage() {
  return (
    <>
      <PageTitle
        title="컨퍼런스"
        description="STDev는 개발자 간 네트워킹을 증진하고, 상호 교류를 통한 인사이트를 제공하기 위해 컨퍼런스를 진행하고 있습니다."
      />
      <div className="conts-area">
        <div className="g-conts-area">
          <h2 className="g-tit-line">STDev가 진행해온 컨퍼런스</h2>
          <div className="g-img-wrap">
            <Image
              src="/images/business/conference-list.png"
              width={4004}
              height={2532}
              sizes="(max-width: 832px) calc(100vw - 32px), 800px"
              alt="STDev가 진행해온 컨퍼런스 목록"
              style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

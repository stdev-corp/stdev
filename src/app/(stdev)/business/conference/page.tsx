import WithLine from '@/components/with-line'
import Image from 'next/image'

export default function ConferencePage() {
  return (
    <>
      <h1>컨퍼런스</h1>
      <p>
        STDev는 개발자 간 네트워킹을 증진하고, 상호 교류를 통한 인사이트를
        제공하기 위해 컨퍼런스를 진행하고 있습니다.
      </p>
      <WithLine>STDev가 진행해온 컨퍼런스</WithLine>
      <Image
        src="/images/business/conference-list.png"
        width={800}
        height={400}
        alt="해커톤"
      />
    </>
  )
}

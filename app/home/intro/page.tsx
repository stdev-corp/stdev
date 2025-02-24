import Image from 'next/image'

export default function IntroPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        안녕하세요, 사단법인 STDev입니다!
      </h1>
      <div className="h-[40px]" />
      <Image
        src="/images/intro/title.png"
        alt="title"
        width={600}
        height={600}
      />
      <div className="h-[40px]" />
      <p>
        KAIST 총학생회 산하 개발 자치단체 하에서 3년간 여섯 차례의 해커톤, 한
        차례의 컨퍼런스를 성공적으로 개최한 기획팀은 앞으로 더 넓은 네트워크의
        구축을 꿈 꿉니다. 개발자의 시각에서, 개발자에게 가장 필요하고 와닿는
        형태로 커뮤니티를 구축하고자 합니다.
      </p>
      <div className="h-[40px]" />
      <p>
        KAIST 총학생회 산하의 학생단체를 벗어나 전국의 개발자, 창업가, 학생,
        청년과 교류하고 협력하기 위해 우리는 과학기술정보통신부 산하의 비영리
        사단법인을 설립했습니다. 2025년 2월, 그 시작을 STDev Conference를 통해
        여러분과 함께 하고자 합니다.
      </p>
      <div className="h-[120px]" />
      <Image src="/images/intro/3w1h.png" alt="3w1h" width={800} height={800} />
      <div className="h-[120px]" />
      {/* <Image
        src="/images/intro/history.png"
        alt="history"
        width={800}
        height={800}
      /> */}
      <div className="h-[120px]" />
    </div>
  )
}

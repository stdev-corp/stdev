import WithLine from '@/components/with-line'
import Image from 'next/image'
import { Heading } from '@chakra-ui/react'

export default function HackathonPage() {
  return (
    <>
      <h1>해커톤</h1>
      <p>
        STDev는 참가자들에게 단기간 프로젝트를 통한 성장과 개발자 간의
        네트워킹을 위해, 꾸준히 해커톤을 주최해왔습니다.
      </p>
      <WithLine>STDev Hackathon Vision</WithLine>
      <Heading as="h3" size="md" color="teal.600" mt={4} mb={2}>
        지속 가능성
      </Heading>
      <p>
        해커톤이 끝나고 난 후에도, 개발한 프로젝트를 창업 또는 개인 프로젝트로
        고도화 시킬 수 있는 지속 가능한 프로젝트의 탄생을 추구합니다.
        <br />
        이를 위해 Demo day, 부스 심사를 통한 산출물에 대한 심층적 피드백, VC
        연결 지원 등 다양한 시도를 해왔습니다.
      </p>
      <Heading as="h3" size="md" color="teal.600" mt={4} mb={2}>
        네트워크 형성
      </Heading>
      <p>
        STDev는 해커톤을 통해 참가자들에게 개발 실력의 성장 뿐 아니라, 새로운
        팀원과의 협업을 통한 네트워크 형성의 경험을 제공하고자 합니다.
        <br />
        실제 참가자들로부터 이전 해커톤의 팀빌딩과 네트워킹 경험에 대해 긍정적인
        피드백을 얻었습니다.
        <br />
        양질의 네트워킹 경험을 제공하기 위해, 참가자 선발부터 팀 빌딩까지 협업
        시에 기대되는 팀원 간 시너지 효과를 가장 우선 순위에 두어 참가자
        매니징을 진행하고 있습니다.
      </p>
      <Heading as="h3" size="md" color="teal.600" mt={4} mb={2}>
        개발자 중심 기획
      </Heading>
      <p>
        행사를 기획하는 인원이 개발자임을 바탕으로, STDev의 해커톤은 개발자의
        시각에서 양질의 개발 환경, 개발자에게 필요한 지원을 하는 운영진이 되도록
        노력하고 있습니다.
        <br />
        개발 플랫폼을 운영하는 기업의 후원을 통해 API를 제공하거나, 원활한
        개발을 위한 IT 지원을 진행하는 등 최상의 개발 경험을 제공하기 위해 기획
        단계부터 운영까지 최선을 다하고 있습니다.
      </p>
      <WithLine>STDev Hackathon Vision</WithLine>
      <Image
        src="/images/business/hackathon-list.png"
        width={800}
        height={400}
        alt="해커톤"
      />
    </>
  )
}

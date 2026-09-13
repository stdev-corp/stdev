import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import SnsLink, {
  GithubLogo,
  HomepageLogo,
  InstagramLogo,
  LinkedinLogo,
  YoutubeLogo,
} from '@/components/layout/sns-link'
import Wordmark from '@/components/krds/wordmark'
import { Links } from '@/utils/links'

// 법정 표기 항목. 항목마다 한 줄을 쓰고 그 줄 안에서 라벨과 값을 나란히 둔다.
const CorpInfo = [
  {
    term: '상호명',
    description: '사단법인 에스티데브 (STDev Nonprofit Corporation)',
  },
  { term: '대표자', description: '한우영' },
  { term: '사업자등록번호', description: '169-82-00606' },
  { term: '통신판매업신고번호', description: '2025-대전서구-0117' },
  { term: '대표전화', description: '0507-1441-9392' },
]

// width/height는 실제 원본 크기여야 로드 전후로 레이아웃이 흔들리지 않는다.
// sizes는 4.8rem 높이로 그렸을 때의 실제 너비라 로고마다 다르다.
const GovLogos = [
  {
    src: '/images/gov/msit-logo.png',
    url: Links.msit,
    alt: '과학기술정보통신부',
    width: 2452,
    height: 458,
    sizes: '264px',
  },
  {
    src: '/images/gov/nts-logo.png',
    url: Links.nts,
    alt: '국세청',
    width: 1655,
    height: 458,
    sizes: '176px',
  },
  {
    src: '/images/gov/acrc-logo.png',
    url: Links.acrc,
    alt: '국민권익위원회',
    width: 2490,
    height: 458,
    sizes: '264px',
  },
]

export default function Footer() {
  return (
    <footer id="krds-footer">
      <div className="inner">
        <div className="f-cnt">
          <div className="f-info">
            <div className="f-logo">
              <Wordmark />
            </div>
            <p className="info-addr">
              대전광역시 서구 월평로 65, 802호 (월평동, 용원빌딩)
            </p>
            <dl className="info-corp">
              {CorpInfo.map((info) => (
                <div key={info.term} className="info-row">
                  <dt>{info.term}</dt>
                  <dd>{info.description}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="f-link">
            <div className="link-go">
              <Link
                href={Links.noticesDonation}
                className="krds-btn medium text"
              >
                연간 기부금 모금액 및 활용실적
                <i className="svg-icon ico-angle right" aria-hidden="true" />
              </Link>
              <Link href={Links.infoSitemap} className="krds-btn medium text">
                사이트맵
                <i className="svg-icon ico-angle right" aria-hidden="true" />
              </Link>
            </div>
            <div className="link-sns">
              <SnsLink
                logo={<HomepageLogo />}
                handle="stdev.kr 홈페이지"
                url="https://stdev.kr"
              />
              <SnsLink
                logo={<InstagramLogo />}
                handle="인스타그램 @stdev.corp"
                url="https://instagram.com/stdev.corp"
              />
              <SnsLink
                logo={<LinkedinLogo />}
                handle="링크드인 @stdev-corp"
                url="https://www.linkedin.com/company/stdev-corp"
              />
              <SnsLink
                logo={<GithubLogo />}
                handle="깃허브 @stdev-corp"
                url="https://github.com/stdev-corp"
              />
              <SnsLink
                logo={<YoutubeLogo />}
                handle="유튜브 @stdev-corp"
                url="https://www.youtube.com/@stdev-corp"
              />
            </div>
          </div>
        </div>

        <div className="f-gov-logos">
          {GovLogos.map((logo) => (
            <a
              key={logo.url}
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              title="새 창 열림"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                sizes={logo.sizes}
              />
            </a>
          ))}
        </div>

        <div className="f-btm">
          <div className="f-btm-text">
            <div className="f-menu">
              <Link href={Links.infoPrivacy}>개인정보처리방침</Link>
              <Link href={Links.infoTerms}>이용약관</Link>
              <Link href={Links.admin}>관리자</Link>
            </div>
            <p className="f-copy">
              © {dayjs().year()} STDev Nonprofit Corporation. All rights
              reserved.
            </p>
          </div>

          <p className="f-attribution">
            본 누리집은 행정안전부에서 공공누리 제1유형으로 개방한 『범정부
            UI/UX 디자인시스템(KRDS)』을 이용하였으며, 해당 저작물은{' '}
            <a
              href="https://www.krds.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              title="새 창 열림"
            >
              KRDS 누리집
            </a>
            에서 무료로 내려받을 수 있습니다.
          </p>
        </div>
      </div>
    </footer>
  )
}

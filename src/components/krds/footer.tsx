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
import { Links } from '@/utils/links'

const GovLogos = [
  {
    src: '/images/gov/msit-logo.png',
    url: Links.msit,
    alt: '과학기술정보통신부',
  },
  { src: '/images/gov/nts-logo.png', url: Links.nts, alt: '국세청' },
  { src: '/images/gov/acrc-logo.png', url: Links.acrc, alt: '국민권익위원회' },
]

export default function Footer() {
  return (
    <footer id="krds-footer">
      <div className="inner">
        <div className="f-logo">사단법인 STDev</div>

        <div className="f-cnt">
          <div className="f-info">
            <p className="info-addr">
              대전광역시 서구 월평로 65, 802호 (월평동, 용원빌딩)
            </p>
            <p className="info-addr">
              상호명: 사단법인 에스티데브 (STDev Nonprofit Corporation) ·
              대표자: 한우영 · 사업자등록번호: 169-82-00606 ·
              통신판매업신고번호: 2025-대전서구-0117
            </p>
            <ul className="info-cs">
              <li>
                <strong className="strong">대표전화 0507-1441-9392</strong>
              </li>
            </ul>
          </div>

          <div className="f-link">
            <div className="link-go">
              <Link href={Links.infoPrivacy} className="krds-btn medium text">
                개인정보처리방침
                <i className="svg-icon ico-angle right" aria-hidden="true" />
              </Link>
              <Link href={Links.infoTerms} className="krds-btn medium text">
                이용약관
                <i className="svg-icon ico-angle right" aria-hidden="true" />
              </Link>
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

        <div className="f-btm">
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
                  width={224}
                  height={48}
                  sizes="224px"
                />
              </a>
            ))}
          </div>

          <div className="f-btm-text">
            <div className="f-menu">
              <Link href={Links.infoPrivacy} className="point">
                개인정보처리방침
              </Link>
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

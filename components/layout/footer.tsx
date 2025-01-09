import dayjs from 'dayjs'
import Logo from '@/components/layout/logo'
import { Links } from '@/utils/links'

export default async function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-lg font-bold mb-2">STDev</h3>
            <p className="text-sm">
              상호명: 사단법인 에스티데브 (STDev Nonprofit Corporation)
              <br />
              사업자등록번호: 169-82-00606
              <br />
              통신판매업신고번호: 2025-대전서구-0117
              <br />
              대표자: 한우영
              <br />
              주소: 대전광역시 서구 월평로 65, 802호 (월평동, 용원빌딩)
              <br />
              전화: 010-2922-9392
            </p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-lg font-bold mb-2">안내 및 공시</h3>
            <ul className="text-sm flex flex-col gap-2">
              <li>
                <a href={Links.infoPrivacy} className="hover:underline">
                  개인정보처리방침
                </a>
              </li>
              <li>
                <a href={Links.infoTerms} className="hover:underline">
                  이용약관
                </a>
              </li>
              <li>
                <a href={Links.noticesDonation} className="hover:underline">
                  연간 기부금 모금액 및 활용실적
                </a>
              </li>
              <li>
                <a href={Links.infoSitemap} className="hover:underline">
                  사이트맵
                </a>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <Logo src="/images/gov/msit-logo.png" url={Links.msit} />
            <Logo src="/images/gov/nts-logo.png" url={Links.nts} />
            <Logo src="/images/gov/acrc-logo.png" url={Links.acrc} />
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          © {dayjs().year()} STDev Nonprofit Corporation. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

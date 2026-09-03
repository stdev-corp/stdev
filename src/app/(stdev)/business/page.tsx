import Link from 'next/link'
import PageTitle from '@/components/krds/page-title'
import { BusinessMenu } from '@/utils/menus'

export default function BusinessPage() {
  return (
    <>
      <PageTitle
        title="행사&프로그램"
        description="STDev가 개발자와 함께 만들어 온 해커톤, 컨퍼런스와 그 기록을 확인하실 수 있습니다."
      />
      <div className="conts-area">
        <div className="g-conts-area">
          <ul className="link-list">
            {BusinessMenu.subMenus.map((subMenu) => (
              <li key={subMenu.href}>
                <Link href={subMenu.href}>
                  <span className="item-tit">{subMenu.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

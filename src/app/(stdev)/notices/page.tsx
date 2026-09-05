import Link from 'next/link'
import PageTitle from '@/components/krds/page-title'
import { NoticesMenu } from '@/utils/menus'

export default async function NoticesPage() {
  return (
    <>
      <PageTitle
        title="공지사항"
        description="사단법인 에스티데브의 보도자료와 공시 자료를 확인하실 수 있습니다."
      />
      <div className="conts-area">
        <div className="g-conts-area">
          <ul className="link-list">
            {NoticesMenu.subMenus.map((subMenu) => (
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

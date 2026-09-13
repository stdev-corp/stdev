import Link from 'next/link'
import PageTitle from '@/components/krds/page-title'
import {
  BusinessMenu,
  InfoMenu,
  IntroMenu,
  Menu,
  NoticesMenu,
} from '@/utils/menus'

type SitemapMenuProps = {
  menu: Menu
}

function SitemapMenu(props: SitemapMenuProps) {
  return (
    <div className="sitemap-col">
      <h2>{props.menu.label}</h2>
      <ul>
        {props.menu.subMenus.map((child) => (
          <li key={child.href}>
            <Link href={child.href} className="krds-btn medium link basic">
              <span className="underline">{child.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function Sitemap() {
  return (
    <>
      <PageTitle title="사이트맵" />
      <div className="conts-area">
        <div className="g-conts-area">
          <div className="sitemap-grid">
            <SitemapMenu menu={IntroMenu} />
            <SitemapMenu menu={BusinessMenu} />
            <SitemapMenu menu={NoticesMenu} />
            <SitemapMenu menu={InfoMenu} />
          </div>
        </div>
      </div>
    </>
  )
}

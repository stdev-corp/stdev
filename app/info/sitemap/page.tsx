import {
  BusinessMenu,
  InfoMenu,
  IntroMenu,
  Menu,
  NoticesMenu,
  ProductsMenu,
} from '@/utils/menus'
import Link from 'next/link'

type SitemapMenuProps = {
  menu: Menu
}

function SitemapMenu(props: SitemapMenuProps) {
  return (
    <div>
      <Link href={props.menu.href} className="mb-8">
        <h2>{props.menu.label}</h2>
      </Link>
      <ul>
        {props.menu.subMenus?.map((child) => (
          <li key={child.href} className="text-xl my-4">
            <Link href={child.href}>{child.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function Sitemap() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1>사이트맵</h1>
      <div className="flex flex-row gap-24">
        <SitemapMenu menu={IntroMenu} />
        <SitemapMenu menu={BusinessMenu} />
        <SitemapMenu menu={NoticesMenu} />
        <SitemapMenu menu={ProductsMenu} />
        <SitemapMenu menu={InfoMenu} />
      </div>
    </div>
  )
}

import { queryEventSitemapPaths } from '@/utils/cms'
import { HOST } from '@/utils/links'
import {
  ConferenceMenu,
  HackathonMenu,
  InfoMenu,
  IntroMenu,
  Menu,
  NoticesMenu,
} from '@/utils/menus'
import type { MetadataRoute } from 'next'

// 행사 페이지 주소를 DB에서 읽으므로 빌드할 때가 아니라 요청마다 만든다.
export const dynamic = 'force-dynamic'

// 구역 자체의 페이지는 없으므로 하위 메뉴만 올린다.
function toSitemap(menu: Menu) {
  return menu.subMenus.map((subMenu) => ({
    url: HOST + subMenu.href,
    lastModified: new Date(),
    priority: 0.6,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await queryEventSitemapPaths()

  return [
    {
      url: HOST,
      lastModified: new Date(),
      priority: 1,
    },
    ...toSitemap(IntroMenu),
    ...toSitemap(HackathonMenu),
    ...toSitemap(ConferenceMenu),
    ...toSitemap(NoticesMenu),
    ...toSitemap(InfoMenu),
    ...events.map((event) => ({
      url: HOST + event.path,
      lastModified: event.lastModified,
      priority: 0.5,
    })),
  ].map((item) => ({ ...item, changeFrequency: 'monthly' }))
}

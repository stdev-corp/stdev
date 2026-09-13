import { HOST } from '@/utils/links'
import {
  BusinessMenu,
  InfoMenu,
  IntroMenu,
  Menu,
  NoticesMenu,
} from '@/utils/menus'
import type { MetadataRoute } from 'next'

// 구역 자체의 페이지는 없으므로 하위 메뉴만 올린다.
function toSitemap(menu: Menu) {
  return menu.subMenus.map((subMenu) => ({
    url: HOST + subMenu.href,
    lastModified: new Date(),
    priority: 0.6,
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: HOST,
      lastModified: new Date(),
      priority: 1,
    },
    ...toSitemap(IntroMenu),
    ...toSitemap(BusinessMenu),
    ...toSitemap(NoticesMenu),
    ...toSitemap(InfoMenu),
  ].map((item) => ({ ...item, changeFrequency: 'monthly' }))
}

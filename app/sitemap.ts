import { HOST } from '@/utils/links'
import {
  BusinessMenu,
  InfoMenu,
  IntroMenu,
  Menu,
  NoticesMenu,
  OtherMenu,
} from '@/utils/menus'
import type { MetadataRoute } from 'next'

function toSitemap(menu: Menu) {
  const menuSitemap = {
    url: HOST + menu.href,
    lastModified: new Date(),
    priority: 0.8,
  }
  const subMenuSitemaps = menu.subMenus.map((subMenu) => ({
    url: HOST + subMenu.href,
    lastModified: new Date(),
    priority: 0.6,
  }))
  return [menuSitemap, ...subMenuSitemaps]
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
    ...toSitemap(OtherMenu),
  ].map((item) => ({ ...item, changeFrequency: 'monthly' }))
}

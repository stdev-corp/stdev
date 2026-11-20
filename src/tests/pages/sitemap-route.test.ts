import { beforeEach, describe, expect, it } from 'vitest'
import { queryEventSitemapPathsMock, resetCmsMocks } from '@/tests/mocks/cms'
import sitemap, { dynamic } from '@/app/(stdev)/sitemap'
import { HOST } from '@/utils/links'
import {
  ConferenceMenu,
  HackathonMenu,
  InfoMenu,
  IntroMenu,
  NoticesMenu,
} from '@/utils/menus'

const eventPaths = [
  {
    path: '/hackathon/dsf26',
    lastModified: new Date('2026-04-01T00:00:00Z'),
  },
  {
    path: '/hackathon/dsf26/faq',
    lastModified: new Date('2026-04-02T00:00:00Z'),
  },
  {
    path: '/conference/stdev-forum-2025',
    lastModified: new Date('2025-10-01T00:00:00Z'),
  },
]

describe('sitemap()', () => {
  beforeEach(() => {
    resetCmsMocks()
  })

  it('is rendered per request because event paths come from the database', () => {
    expect(dynamic).toBe('force-dynamic')
  })

  it('returns a promise of an array', async () => {
    const pending = sitemap()
    expect(pending).toBeInstanceOf(Promise)
    expect(Array.isArray(await pending)).toBe(true)
  })

  it('every entry has a url field that starts with HOST', async () => {
    queryEventSitemapPathsMock.mockResolvedValue(eventPaths)
    const result = await sitemap()
    for (const entry of result) {
      expect(typeof entry.url).toBe('string')
      expect(entry.url.startsWith(HOST)).toBe(true)
    }
  })

  it('includes the root url with priority 1', async () => {
    const result = await sitemap()
    const root = result.find((e) => e.url === HOST)
    expect(root?.priority).toBe(1)
  })

  it.each([
    { name: 'IntroMenu', menu: IntroMenu },
    { name: 'HackathonMenu', menu: HackathonMenu },
    { name: 'ConferenceMenu', menu: ConferenceMenu },
    { name: 'NoticesMenu', menu: NoticesMenu },
    { name: 'InfoMenu', menu: InfoMenu },
  ])('includes all $name hrefs with priority 0.6', async ({ menu }) => {
    const result = await sitemap()
    for (const sub of menu.subMenus) {
      const entry = result.find((e) => e.url === HOST + sub.href)
      expect(entry?.priority).toBe(0.6)
    }
  })

  it('lists the hackathon and conference landing pages, which now exist', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toContain(HOST + '/hackathon')
    expect(urls).toContain(HOST + '/conference')
  })

  it('does not list bare section paths that have no page', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    for (const menu of [IntroMenu, NoticesMenu, InfoMenu]) {
      expect(urls).not.toContain(HOST + menu.path)
    }
  })

  it('does not list the removed /business pages', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls.some((url) => url.startsWith(`${HOST}/business`))).toBe(false)
  })

  it('appends event pages from the database with priority 0.5 and their own lastModified', async () => {
    queryEventSitemapPathsMock.mockResolvedValue(eventPaths)
    const result = await sitemap()

    expect(queryEventSitemapPathsMock).toHaveBeenCalledTimes(1)
    for (const event of eventPaths) {
      expect(result.find((e) => e.url === HOST + event.path)).toEqual({
        url: HOST + event.path,
        lastModified: event.lastModified,
        priority: 0.5,
        changeFrequency: 'monthly',
      })
    }
    // 메뉴 페이지 뒤에 DB 순서 그대로 붙인다.
    expect(result.slice(-eventPaths.length).map((e) => e.url)).toEqual(
      eventPaths.map((event) => HOST + event.path),
    )
  })

  it('lists only menu pages when there are no event pages', async () => {
    const result = await sitemap()
    const menuPageCount = [
      IntroMenu,
      HackathonMenu,
      ConferenceMenu,
      NoticesMenu,
      InfoMenu,
    ].reduce((count, menu) => count + menu.subMenus.length, 0)
    expect(result).toHaveLength(1 + menuPageCount)
    expect(result.some((e) => e.priority === 0.5)).toBe(false)
  })

  it('lists every url only once', async () => {
    queryEventSitemapPathsMock.mockResolvedValue(eventPaths)
    const urls = (await sitemap()).map((e) => e.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('every entry has changeFrequency set to monthly and a lastModified date', async () => {
    queryEventSitemapPathsMock.mockResolvedValue(eventPaths)
    const result = await sitemap()
    for (const entry of result) {
      expect(entry.changeFrequency).toBe('monthly')
      expect(entry.lastModified).toBeInstanceOf(Date)
    }
  })
})

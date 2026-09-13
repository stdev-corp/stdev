import { test, expect, type Page } from '@playwright/test'
import { isDatabaseAvailable } from './fixtures/db'

const publicPaths = [
  '/',
  '/intro/about',
  '/intro/history',
  '/intro/chart',
  '/intro/directors',
  '/intro/articles',
  '/business/blog',
  '/business/news',
  '/business/hackathon',
  '/business/conference',
  '/notices/press',
  '/notices/donation',
  '/notices/records',
  '/info/privacy',
  '/info/terms',
  '/info/sitemap',
]

/** 어떤 라우트에도 맞지 않는 URL은 KRDS 셸을 갖춘 한국어 404 화면이어야 한다. */
async function expectPublicNotFound(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
  await expect(page.locator('#krds-header')).toBeVisible()
  await expect(page.locator('#krds-footer')).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: '404 Not Found' }),
  ).toBeVisible()
  await expect(
    page.getByText('요청하신 페이지를 찾을 수 없습니다.'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '홈페이지로 돌아가기' }),
  ).toHaveAttribute('href', '/')
  await expect(page.getByText('This page could not be found')).toHaveCount(0)
}

test.describe('public navigation', () => {
  test.beforeEach(async () => {
    test.skip(
      !(await isDatabaseAvailable()),
      'Test Postgres is unavailable; run docker compose -f docker-compose.test.yml up -d postgres',
    )
  })

  test('landing page loads with KRDS chrome, hero and footer', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/STDev/i)
    await expect(page.locator('#krds-header')).toBeVisible()
    await expect(page.locator('#krds-footer')).toBeVisible()
    await expect(
      page.getByAltText('STDev - 개발자를 위한 커뮤니티를 만듭니다'),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: '본문 바로가기' }),
    ).toBeAttached()
  })

  test('desktop GNB navigates into a section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    await page.getByRole('button', { name: '법인소개' }).click()
    await page
      .locator('.gnb-toggle-wrap.is-open')
      .getByRole('link', { name: '연혁' })
      .click()

    await expect(page).toHaveURL(/\/intro\/history$/)
    await expect(page.locator('h1.h-tit')).toHaveText('연혁')
  })

  test('section pages render breadcrumb and side navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/intro/history')

    const breadcrumb = page.locator('nav.krds-breadcrumb-wrap')
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByRole('link', { name: '홈' })).toBeVisible()

    const lnb = page.locator('nav.krds-side-navigation')
    await expect(lnb.locator('.lnb-tit')).toHaveText('법인소개')
    await expect(lnb.locator('li.lnb-item.active')).toHaveText('연혁')
  })

  for (const path of publicPaths) {
    test(`${path} loads`, async ({ page }) => {
      const response = await page.goto(path)

      expect(response?.status()).toBeLessThan(400)
      await expect(page.locator('body')).toBeVisible()
      await expect(page.locator('#krds-footer')).toBeAttached()
    })
  }

  test('robots.txt is served as plain text and points at the sitemap', async ({
    page,
  }) => {
    const response = await page.request.get('/robots.txt')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/^text\/plain/)
    const body = await response.text()
    expect(body).toContain('User-Agent: *')
    expect(body).toContain('Disallow: /admin/')
    expect(body).toContain('Disallow: /api/')
    expect(body).toContain('Sitemap: https://stdev.kr/sitemap.xml')
  })

  test('sitemap.xml lists the public pages', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/xml/)
    const body = await response.text()
    expect(body).toContain('/intro/about</loc>')
    expect(body).not.toContain('/business</loc>')
  })

  test('unknown path returns the public 404 page', async ({ page }) => {
    const response = await page.goto('/unknown-e2e-path')

    expect(response?.status()).toBe(404)
    await expectPublicNotFound(page)
  })

  test('/intro permanently redirects to /intro/about', async ({ page }) => {
    const redirect = await page.request.get('/intro', { maxRedirects: 0 })
    expect(redirect.status()).toBe(308)
    expect(redirect.headers()['location']).toMatch(/\/intro\/about$/)

    await page.goto('/intro')
    await expect(page).toHaveURL(/\/intro\/about$/)
    await expect(page.locator('h1.h-tit')).toHaveText('사단법인 에스티데브')
  })

  for (const path of ['/business', '/notices']) {
    test(`removed section index ${path} returns 404`, async ({ page }) => {
      const response = await page.goto(path)

      expect(response?.status()).toBe(404)
      await expectPublicNotFound(page)
    })
  }
})

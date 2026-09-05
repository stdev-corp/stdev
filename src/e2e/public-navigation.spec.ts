import { test, expect } from '@playwright/test'
import { isDatabaseAvailable } from './fixtures/db'

const publicPaths = [
  '/',
  '/intro',
  '/intro/history',
  '/intro/chart',
  '/intro/directors',
  '/intro/articles',
  '/business',
  '/business/blog',
  '/business/news',
  '/business/hackathon',
  '/business/conference',
  '/notices',
  '/notices/press',
  '/notices/donation',
  '/notices/records',
  '/info/privacy',
  '/info/terms',
  '/info/sitemap',
]

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

  test('unknown path returns 404', async ({ page }) => {
    const response = await page.goto('/unknown-e2e-path')

    expect(response?.status()).toBe(404)
  })
})

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

  test('landing page loads with hero and footer', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/STDev/i)
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.getByAltText('title')).toBeVisible()
  })

  test('can navigate to intro', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '법인소개' }).click()
    await page.getByRole('menuitem', { name: '법인소개' }).click()
    await expect(page).toHaveURL(/\/intro/)
  })

  for (const path of publicPaths) {
    test(`${path} loads`, async ({ page }) => {
      const response = await page.goto(path)

      expect(response?.status()).toBeLessThan(400)
      await expect(page.locator('body')).toBeVisible()
    })
  }

  test('unknown path returns 404', async ({ page }) => {
    const response = await page.goto('/unknown-e2e-path')

    expect(response?.status()).toBe(404)
  })
})

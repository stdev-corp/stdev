import { test, expect } from '@playwright/test'
import { isDatabaseAvailable } from './fixtures/db'

test.describe('public responsive navigation', () => {
  test.beforeEach(async () => {
    test.skip(
      !(await isDatabaseAvailable()),
      'Test Postgres is unavailable; run docker compose -f docker-compose.test.yml up -d postgres',
    )
  })

  test('desktop navbar shows dropdown menus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    await expect(page.getByRole('button', { name: '법인소개' })).toBeVisible()
    await page.getByRole('button', { name: '법인소개' }).click()
    await expect(page.getByRole('menuitem', { name: '연혁' })).toBeVisible()
  })

  test('mobile hamburger opens drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: '메뉴 열기' })

    await expect(menuButton).toBeVisible()
    await menuButton.click()
    await expect(page.getByRole('button', { name: '닫기' })).toBeVisible()
    await expect(
      page.locator('p').filter({ hasText: /^법인소개$/ }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: '연혁' })).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'
import { isDatabaseAvailable } from './fixtures/db'

test.describe('public responsive navigation', () => {
  test.beforeEach(async () => {
    test.skip(
      !(await isDatabaseAvailable()),
      'Test Postgres is unavailable; run docker compose -f docker-compose.test.yml up -d postgres',
    )
  })

  test('desktop shows the KRDS main menu with dropdown panels', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    await expect(page.locator('nav.krds-main-menu')).toBeVisible()
    await expect(page.locator('button.btn-navi.all')).toBeHidden()

    const trigger = page.getByRole('button', { name: '법인소개' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const panel = page.locator('.gnb-toggle-wrap.is-open')
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('link', { name: '연혁' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('.gnb-toggle-wrap.is-open')).toHaveCount(0)
  })

  test('mobile 전체메뉴 opens the KRDS drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await expect(page.locator('nav.krds-main-menu')).toBeHidden()

    const menuButton = page.getByRole('button', {
      name: '전체메뉴',
      exact: true,
    })
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    const drawer = page.locator('#mobile-nav')
    await expect(drawer).toHaveClass(/is-open/)
    await expect(drawer.getByRole('link', { name: '연혁' })).toBeVisible()

    await page.getByRole('button', { name: '전체메뉴 닫기' }).click()
    await expect(drawer).not.toHaveClass(/is-open/)
  })

  test('mobile hides the side navigation and keeps content within the viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/notices/donation')

    await expect(page.locator('nav.krds-side-navigation')).toBeHidden()

    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    )
    expect(overflows).toBe(false)
  })
})

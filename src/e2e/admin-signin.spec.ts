import { test, expect } from '@playwright/test'
import { isDatabaseAvailable } from './fixtures/db'

test.describe('admin sign-in', () => {
  test.beforeEach(async () => {
    test.skip(
      !(await isDatabaseAvailable()),
      'Test Postgres is unavailable; run docker compose -f docker-compose.test.yml up -d postgres',
    )
  })

  test('admin redirects to sign-in without auth cookie', async ({ page }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/admin\/sign-in/)
  })

  test('sign-in page loads with Google button', async ({ page }) => {
    await page.goto('/admin/sign-in')

    await expect(
      page.getByRole('heading', { name: 'CMS 로그인' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Google 계정으로 로그인' }),
    ).toBeVisible()
  })
})

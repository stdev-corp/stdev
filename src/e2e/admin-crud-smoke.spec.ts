import { test, expect } from '@playwright/test'
import { isDatabaseAvailable } from './fixtures/db'
import { seedAdminSession } from './fixtures/auth'

test.describe('admin CRUD smoke', () => {
  test.beforeEach(async () => {
    test.skip(
      !(await isDatabaseAvailable()),
      'Test Postgres is unavailable; run docker compose -f docker-compose.test.yml up -d postgres',
    )
  })

  test('seeded admin session reaches dashboard', async ({ context, page }) => {
    await seedAdminSession(context)
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()
    await expect(
      page.getByRole('complementary').getByText('e2e@stdev.kr'),
    ).toBeVisible()

    for (const [label, href] of [
      ['사업', '/admin/businesses'],
      ['이미지', '/admin/images'],
      ['파일', '/admin/files'],
      ['기관', '/admin/institutions'],
      ['마크다운', '/admin/markdowns'],
      ['웹페이지', '/admin/webpages'],
      ['보고서', '/admin/reports'],
      ['연혁', '/admin/histories'],
      ['설정', '/admin/settings'],
    ]) {
      await expect(
        page.getByRole('term').getByRole('link', { name: label, exact: true }),
      ).toHaveAttribute('href', href)
    }
  })
})

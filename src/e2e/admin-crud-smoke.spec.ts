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
      ['사업(행사)', '/admin/businesses'],
      ['행사 하위 페이지', '/admin/business-pages'],
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

  test('long edit drawers scroll down to their save button', async ({
    context,
    page,
  }) => {
    await seedAdminSession(context)
    // 행사 폼(기관 선택, 본문 편집기)은 화면보다 길다. 서랍 본문이 스크롤되어야 아래쪽
    // 입력란과 저장 버튼에 닿는다.
    await page.setViewportSize({ width: 1280, height: 720 })

    for (const path of ['/admin/businesses', '/admin/business-pages']) {
      await page.goto(path)
      await page.getByRole('button', { name: '수정' }).first().click()
      const dialog = page.getByRole('dialog')
      const save = dialog.getByRole('button', { name: '저장' })

      await expect(save).toBeVisible()
      await save.scrollIntoViewIfNeeded()
      await expect(save).toBeInViewport()
      await dialog.getByRole('button', { name: '취소' }).click()
      await expect(dialog).toHaveCount(0)
    }
  })
})

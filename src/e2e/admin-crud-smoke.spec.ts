import { test, expect } from '@playwright/test'
import { isDatabaseAvailable } from './fixtures/db'
import { seedAdminSession } from './fixtures/auth'

// 시드: 'E2E 뉴스 기사'만 원문 저장본(e2e-news-archive.pdf)에 연결돼 있다.
const archiveUrl =
  'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/e2e-news-archive.pdf'

/** EntityList의 한 줄(본문과 수정·삭제 버튼을 감싼 상자) */
const ROW = 'xpath=ancestor::div[.//button[normalize-space(.)="수정"]][1]'

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

  // seedAdminSession은 같은 관리자를 지우고 다시 만든다. 관리자 세션을 쓰는 테스트는
  // 이 파일에 두어 한 워커에서 차례로 돌게 한다.
  test('webpage list links each article to its saved PDF', async ({
    context,
    page,
  }) => {
    await seedAdminSession(context)
    await page.goto('/admin/webpages')

    const news = page.getByText('E2E 뉴스 기사').locator(ROW)
    const link = news.getByRole('link', { name: 'e2e-news-archive.pdf' })
    await expect(link).toHaveAttribute('href', archiveUrl)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(page.getByText('원문 저장본: 없음')).toHaveCount(2)

    // 수정 서랍은 연결된 저장본을 골라 둔 채로 열린다.
    await news.getByRole('button', { name: '수정' }).click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByLabel('원문 저장본').locator('option:checked'),
    ).toHaveText(/e2e-news-archive\.pdf$/)
    await dialog.getByRole('button', { name: '취소' }).click()
    await expect(dialog).toHaveCount(0)
  })

  test('a file used as an original archive cannot be deleted', async ({
    context,
    page,
  }) => {
    await seedAdminSession(context)
    await page.goto('/admin/files')

    const row = page.getByText(/· e2e-news-archive\.pdf$/)
    await row.locator(ROW).getByRole('button', { name: '삭제' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click()

    await expect(page.getByText('삭제 실패')).toBeVisible()
    await page.reload()
    await expect(page.getByText(/· e2e-news-archive\.pdf$/)).toBeVisible()
  })
})

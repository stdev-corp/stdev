import { test, expect, type Page } from '@playwright/test'
import { isDatabaseAvailable } from './fixtures/db'

const publicPaths = [
  '/',
  '/intro/about',
  '/intro/history',
  '/intro/chart',
  '/intro/directors',
  '/intro/articles',
  '/hackathon',
  '/hackathon/news',
  '/hackathon/blog',
  '/hackathon/e2e-hackathon',
  '/hackathon/e2e-hackathon/faq',
  '/conference',
  '/conference/news',
  '/conference/blog',
  '/conference/e2e-conference',
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
    expect(body).toContain('/hackathon/e2e-hackathon</loc>')
    expect(body).toContain('/hackathon/e2e-hackathon/faq</loc>')
    expect(body).not.toContain('/business')
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

  test('/notices section index returns 404', async ({ page }) => {
    const response = await page.goto('/notices')

    expect(response?.status()).toBe(404)
    await expectPublicNotFound(page)
  })

  for (const [from, to] of [
    ['/business', '/hackathon'],
    ['/business/hackathon', '/hackathon'],
    ['/business/conference', '/conference'],
    ['/business/news', '/hackathon/news'],
    ['/business/blog', '/hackathon/blog'],
  ]) {
    test(`${from} permanently redirects to ${to}`, async ({ page }) => {
      const redirect = await page.request.get(from, { maxRedirects: 0 })
      expect(redirect.status()).toBe(308)
      expect(new URL(redirect.headers()['location'], 'http://x').pathname).toBe(
        to,
      )
    })
  }
})

test.describe('event pages', () => {
  test.beforeEach(async () => {
    test.skip(
      !(await isDatabaseAvailable()),
      'Test Postgres is unavailable; run docker compose -f docker-compose.test.yml up -d postgres',
    )
  })

  test('section page shows the intro and events newest first', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/hackathon')

    await expect(page.locator('h1.h-tit')).toHaveText('해커톤&아이디어톤')
    await expect(page.getByText('E2E 해커톤 구역 소개')).toBeVisible()
    const titles = page.locator('.event-item-tit')
    await expect(titles).toHaveText(['E2E 해커톤', 'E2E 지난 해커톤'])
    await expect(titles.first().getByRole('link')).toHaveAttribute(
      'href',
      '/hackathon/e2e-hackathon',
    )
    // 슬러그가 없는 행사는 목록에만 있고 링크가 없다.
    await expect(titles.nth(1).getByRole('link')).toHaveCount(0)
    await expect(
      page.locator('.krds-side-navigation li.lnb-item.active'),
    ).toHaveText('행사 소개')
  })

  test('event page renders the Notion layout and the KRDS overview', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/hackathon/e2e-hackathon')

    await expect(page).toHaveTitle('E2E 해커톤 | STDev Corp.')
    await expect(page.locator('h1.notion-title')).toHaveText('E2E 해커톤')
    await expect(page.locator('h1')).toHaveCount(1)
    const overview = page.locator('.event-overview')
    await expect(
      overview.getByText('2026년 1월 1일 (목) ~ 1월 2일 (금)'),
    ).toBeVisible()
    await expect(
      overview.getByRole('link', { name: 'E2E 협력 기관' }),
    ).toHaveAttribute('href', 'https://example.com/e2e-partner')
    await expect(overview.getByText('E2E 후원사')).toBeVisible()
    await expect(page.locator('.notion-callout')).toContainText('E2E 콜아웃')

    const toggle = page.locator('details.notion-toggle')
    await expect(toggle.getByText('E2E 토글 답변')).toBeHidden()
    await toggle.locator('summary').click()
    await expect(toggle.getByText('E2E 토글 답변')).toBeVisible()

    const breadcrumb = page.locator('nav.krds-breadcrumb-wrap')
    await expect(
      breadcrumb.getByRole('link', { name: '행사 소개' }),
    ).toHaveAttribute('href', '/hackathon')
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      'E2E 해커톤',
    )

    await page.getByRole('link', { name: 'E2E 자주 묻는 질문' }).click()
    await expect(page).toHaveURL(/\/hackathon\/e2e-hackathon\/faq$/)
    await expect(page.locator('h1.notion-title')).toHaveText(
      'E2E 자주 묻는 질문',
    )
    await expect(page.getByText('E2E 하위 페이지 본문')).toBeVisible()
    await expect(
      page
        .locator('nav.krds-breadcrumb-wrap')
        .getByRole('link', { name: 'E2E 해커톤' }),
    ).toHaveAttribute('href', '/hackathon/e2e-hackathon')
  })

  test('event in the other section redirects to its own section', async ({
    page,
  }) => {
    // 페이지 안의 리다이렉트라 (stdev)/loading.tsx 스트리밍 뒤에 브라우저가 옮긴다.
    await page.goto('/conference/e2e-hackathon')
    await expect(page).toHaveURL(/\/hackathon\/e2e-hackathon$/)
    await expect(page.locator('h1.notion-title')).toHaveText('E2E 해커톤')
  })

  test('old Notion page IDs answer a real 308 to the migrated pages', async ({
    page,
  }) => {
    for (const [id, to] of [
      ['32d3ff07ff5b8001ae54c458f8571ea3', '/hackathon/e2e-hackathon'],
      ['32d3ff07-ff5b-802e-9590-d11a59608612', '/hackathon/e2e-hackathon/faq'],
    ]) {
      const redirect = await page.request.get(`/hackathon/${id}`, {
        maxRedirects: 0,
      })
      expect(redirect.status()).toBe(308)
      expect(redirect.headers()['location']).toMatch(new RegExp(`${to}$`))
    }
    // 옮기지 않은 노션 페이지는 진짜 404
    const missing = await page.request.get(
      '/hackathon/00000000000000000000000000000000',
      { maxRedirects: 0 },
    )
    expect(missing.status()).toBe(404)
  })

  test('event.stdev.kr paths redirect to the same slug on stdev.kr', async ({
    page,
  }) => {
    for (const [from, to] of [
      ['/dsf26/faq', 'https://stdev.kr/hackathon/dsf26/faq'],
      ['/', 'https://stdev.kr/hackathon'],
      ['/1b83ff07-ff5b-8051-810e-ea2915cdc850', 'https://stdev.kr/hackathon'],
    ]) {
      const redirect = await page.request.get(from, {
        headers: { host: 'event.stdev.kr' },
        maxRedirects: 0,
      })
      expect(redirect.status()).toBe(308)
      expect(redirect.headers()['location']).toBe(to)
    }
  })

  test('news lists only articles linked to events in the section', async ({
    page,
  }) => {
    await page.goto('/hackathon/news')
    await expect(page.getByText('E2E 뉴스 기사')).toBeVisible()
    await page.goto('/conference/news')
    await expect(page.getByText('E2E 뉴스 기사')).toHaveCount(0)
  })
})

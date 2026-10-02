import {
  test,
  expect,
  type APIRequestContext,
  type Locator,
} from '@playwright/test'

// Seeded CMS assets keep the bucket's AWS address, and S3_PUBLIC_BASE_URL in
// .env.test moves them onto the S3 sidecar when pages render. An asset that is
// not on the sidecar means the rewrite stopped applying and E2E would reach
// AWS; a failing /_next/image response means the optimizer could not fetch it.
async function expectOptimizedFromSidecar(
  image: Locator,
  request: APIRequestContext,
) {
  // next/image points src at its optimizer, /_next/image?url=<asset>&w=…, even
  // before the lazy image loads, so this works for the moving logo marquee too.
  const src = (await image.getAttribute('src')) ?? ''
  const asset = new URL(src, 'http://localhost').searchParams.get('url') ?? ''
  expect(asset.startsWith(`${process.env.S3_PUBLIC_BASE_URL}/`)).toBe(true)

  const response = await request.get(src)
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toMatch(/^image\//)
}

test.describe('CMS assets', () => {
  test('history image is optimized from the S3 sidecar', async ({
    page,
    request,
  }) => {
    await page.goto('/intro/history')
    await expectOptimizedFromSidecar(
      page.getByRole('img', { name: 'E2E 연혁 이미지' }),
      request,
    )
  })

  test('partner logo is optimized from the S3 sidecar', async ({
    page,
    request,
  }) => {
    await page.goto('/')
    await expectOptimizedFromSidecar(
      page.getByRole('img', { name: 'E2E 협력 기관 로고' }).first(),
      request,
    )
  })

  test('report PDF links point at the S3 sidecar', async ({
    page,
    request,
  }) => {
    await page.goto('/notices/records')
    const href =
      (await page
        .getByRole('link', { name: 'E2E 회의록 PDF 새 창으로 열기' })
        .getAttribute('href')) ?? ''

    expect(href.startsWith(`${process.env.S3_PUBLIC_BASE_URL}/`)).toBe(true)
    const response = await request.get(href)
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toBe('application/pdf')
  })
})

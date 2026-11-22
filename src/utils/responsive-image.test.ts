import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTENT_IMAGE_SIZES, responsiveImage } from '@/utils/responsive-image'

const S3 = 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com'

describe('responsiveImage', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('S3 이미지를 본문 폭 기준 srcSet으로 최적화한다', () => {
    const image = responsiveImage(`${S3}/images/banner.png`)
    expect(image.src).toBe(
      `/_next/image?url=${encodeURIComponent(`${S3}/images/banner.png`)}&w=3840&q=75`,
    )
    expect(image.sizes).toBe(CONTENT_IMAGE_SIZES)
    expect(image.srcSet).toContain('640w')
    expect(image.srcSet).toContain('1920w')
  })

  it('보이는 폭을 주면 그 폭을 sizes로 쓴다', () => {
    const image = responsiveImage(`${S3}/images/logo.png`, 240)
    expect(image.sizes).toBe('240px')
    expect(image.srcSet).toContain('256w')
  })

  it('E2E에서는 S3 사이드카 주소를 최적화 대상으로 넘긴다', () => {
    vi.stubEnv('S3_PUBLIC_BASE_URL', 'http://127.0.0.1:9000/stdev-kr')
    const image = responsiveImage(`${S3}/images/a.png`)
    expect(image.src).toContain(
      encodeURIComponent('http://127.0.0.1:9000/stdev-kr/images/a.png'),
    )
  })

  it.each([
    [`${S3}/images/icon.svg`],
    [`${S3}/images/anim.gif`],
    ['https://cdn.example.com/photo.png'],
  ])('%s 은(는) 최적화하지 않고 원본을 쓴다', (url) => {
    expect(responsiveImage(url)).toEqual({ src: url })
  })
})

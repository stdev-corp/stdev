import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isSafeHttpsUrl,
  isAllowedImageUrl,
  requireSafeHttpsUrl,
  isSafePdfUrl,
  requireSafePdfUrl,
  requireSafeImageUrl,
} from '@/utils/public-url'

const S3_HOST = 'stdev-kr.s3.ap-northeast-2.amazonaws.com'

describe('isSafeHttpsUrl', () => {
  it('returns false for null', () => {
    expect(isSafeHttpsUrl(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isSafeHttpsUrl(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isSafeHttpsUrl('')).toBe(false)
  })

  it('returns false for http URL', () => {
    expect(isSafeHttpsUrl('http://example.com')).toBe(false)
  })

  it('returns true for valid https URL', () => {
    expect(isSafeHttpsUrl('https://example.com')).toBe(true)
  })

  it('returns false for malformed URL', () => {
    expect(isSafeHttpsUrl('not-a-url')).toBe(false)
  })

  it('returns true for https URL with path', () => {
    expect(isSafeHttpsUrl('https://example.com/foo/bar.png')).toBe(true)
  })

  it('returns false for ftp URL', () => {
    expect(isSafeHttpsUrl('ftp://example.com/file')).toBe(false)
  })
})

describe('isAllowedImageUrl', () => {
  it('returns false for http URL on allowed host', () => {
    expect(isAllowedImageUrl(`http://${S3_HOST}/images/foo.png`)).toBe(false)
  })

  it('returns false for wrong host even with /images/ path', () => {
    expect(isAllowedImageUrl('https://other.example.com/images/foo.png')).toBe(
      false,
    )
  })

  it('returns true for allowed host with /images/ path', () => {
    expect(isAllowedImageUrl(`https://${S3_HOST}/images/photo.jpg`)).toBe(true)
  })

  it('returns true for allowed host ending with .png extension', () => {
    expect(isAllowedImageUrl(`https://${S3_HOST}/assets/photo.png`)).toBe(true)
  })

  it('returns true for allowed host ending with .webp extension', () => {
    expect(isAllowedImageUrl(`https://${S3_HOST}/pics/image.webp`)).toBe(true)
  })

  it('returns true for allowed host ending with .svg extension', () => {
    expect(isAllowedImageUrl(`https://${S3_HOST}/pics/logo.svg`)).toBe(true)
  })

  it('returns false for allowed host with non-image path (no extension, no /images/)', () => {
    expect(isAllowedImageUrl(`https://${S3_HOST}/data/file`)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isAllowedImageUrl(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isAllowedImageUrl(undefined)).toBe(false)
  })
})

describe('requireSafeHttpsUrl', () => {
  it('returns the url unchanged when valid https', () => {
    const url = 'https://example.com/path'
    expect(requireSafeHttpsUrl(url, '링크')).toBe(url)
  })

  it('throws Korean error message for http URL', () => {
    expect(() => requireSafeHttpsUrl('http://example.com', '링크')).toThrow(
      '링크은(는) 올바른 HTTPS URL이어야 합니다.',
    )
  })

  it('throws with field name embedded in error message', () => {
    expect(() => requireSafeHttpsUrl('not-a-url', '필드명')).toThrow(
      '필드명은(는) 올바른 HTTPS URL이어야 합니다.',
    )
  })
})

describe('isSafePdfUrl', () => {
  it('returns false for http PDF URL', () => {
    expect(isSafePdfUrl('http://example.com/file.pdf')).toBe(false)
  })

  it('returns true for https PDF URL', () => {
    expect(isSafePdfUrl('https://example.com/file.pdf')).toBe(true)
  })

  it('returns true for uppercase .PDF extension', () => {
    expect(isSafePdfUrl('https://example.com/file.PDF')).toBe(true)
  })

  it('returns false for non-pdf extension', () => {
    expect(isSafePdfUrl('https://example.com/file.doc')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isSafePdfUrl(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isSafePdfUrl(undefined)).toBe(false)
  })
})

describe('requireSafePdfUrl', () => {
  it('returns the url unchanged for valid pdf URL', () => {
    const url = 'https://example.com/report.pdf'
    expect(requireSafePdfUrl(url, '파일')).toBe(url)
  })

  it('throws Korean error message for non-pdf URL', () => {
    expect(() =>
      requireSafePdfUrl('https://example.com/file.doc', '파일'),
    ).toThrow('파일은(는) 올바른 HTTPS PDF URL이어야 합니다.')
  })

  it('throws for http pdf URL', () => {
    expect(() =>
      requireSafePdfUrl('http://example.com/file.pdf', '문서'),
    ).toThrow('문서은(는) 올바른 HTTPS PDF URL이어야 합니다.')
  })
})

describe('requireSafeImageUrl', () => {
  it('returns the url unchanged for valid allowed image URL', () => {
    const url = `https://${S3_HOST}/images/photo.jpg`
    expect(requireSafeImageUrl(url, '이미지')).toBe(url)
  })

  it('throws Korean error message for disallowed host', () => {
    expect(() =>
      requireSafeImageUrl('https://other.com/images/photo.jpg', '이미지'),
    ).toThrow(
      '이미지은(는) 허용된 S3 호스트의 올바른 HTTPS 이미지 URL이어야 합니다.',
    )
  })

  it('throws for http image URL on allowed host', () => {
    expect(() =>
      requireSafeImageUrl(`http://${S3_HOST}/images/photo.jpg`, '썸네일'),
    ).toThrow(
      '썸네일은(는) 허용된 S3 호스트의 올바른 HTTPS 이미지 URL이어야 합니다.',
    )
  })
})

describe('allowedImageHosts with dynamic env', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('adds custom S3_BUCKET and AWS_REGION to allowedImageHosts', async () => {
    vi.stubEnv('S3_BUCKET', 'custom-bucket')
    vi.stubEnv('AWS_REGION', 'us-east-1')
    const mod = await import('@/utils/public-url')
    expect(
      mod.isAllowedImageUrl(
        'https://custom-bucket.s3.us-east-1.amazonaws.com/images/photo.png',
      ),
    ).toBe(true)
  })

  it('rejects a host that does not match custom S3_BUCKET/AWS_REGION', async () => {
    vi.stubEnv('S3_BUCKET', 'custom-bucket')
    vi.stubEnv('AWS_REGION', 'us-east-1')
    const mod = await import('@/utils/public-url')
    expect(
      mod.isAllowedImageUrl(
        'https://other-bucket.s3.us-east-1.amazonaws.com/images/photo.png',
      ),
    ).toBe(false)
  })
})

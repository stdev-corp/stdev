const allowedImageHosts = new Set(
  [
    'stdev-kr.s3.ap-northeast-2.amazonaws.com',
    process.env.S3_BUCKET
      ? `${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION ?? 'ap-northeast-2'}.amazonaws.com`
      : null,
  ].filter((host): host is string => Boolean(host)),
)

export function isSafeHttpsUrl(url: string | null | undefined) {
  if (!url) {
    return false
  }

  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

export function isAllowedImageUrl(url: string | null | undefined) {
  if (!isSafeHttpsUrl(url)) {
    return false
  }

  try {
    const parsed = new URL(url as string)
    const pathname = parsed.pathname.toLowerCase()
    const looksLikeImagePath =
      pathname.includes('/images/') ||
      ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].some((extension) =>
        pathname.endsWith(extension),
      )

    return allowedImageHosts.has(parsed.hostname) && looksLikeImagePath
  } catch {
    return false
  }
}

export function requireSafeHttpsUrl(url: string, fieldName: string) {
  if (!isSafeHttpsUrl(url)) {
    throw new Error(`${fieldName}은(는) 올바른 HTTPS URL이어야 합니다.`)
  }

  return url
}

export function isSafePdfUrl(url: string | null | undefined) {
  if (!isSafeHttpsUrl(url)) {
    return false
  }

  return new URL(url as string).pathname.toLowerCase().endsWith('.pdf')
}

export function requireSafePdfUrl(url: string, fieldName: string) {
  if (!isSafePdfUrl(url)) {
    throw new Error(`${fieldName}은(는) 올바른 HTTPS PDF URL이어야 합니다.`)
  }

  return url
}

export function requireSafeImageUrl(url: string, fieldName: string) {
  if (!isAllowedImageUrl(url)) {
    throw new Error(
      `${fieldName}은(는) 허용된 S3 호스트의 올바른 HTTPS 이미지 URL이어야 합니다.`,
    )
  }

  return url
}

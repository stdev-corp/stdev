import { getImageProps } from 'next/image'
import { isAllowedImageUrl, toPublicAssetUrl } from '@/utils/public-url'

/** 본문 폭(최대 900px, 좁은 화면은 화면 폭)에 맞춘 이미지 크기 힌트 */
export const CONTENT_IMAGE_SIZES =
  '(max-width: 1023px) calc(100vw - 32px), 900px'

export type ResponsiveImage = {
  src: string
  srcSet?: string
  sizes?: string
}

/**
 * S3 이미지는 Next 이미지 최적화(/_next/image)를 거친 srcSet으로 그린다. 노션에서
 * 옮긴 원본은 4800px PNG처럼 커서 그대로 내려보내면 무겁다. 크기를 모르는 본문
 * 이미지라 next/image 컴포넌트 대신 getImageProps로 속성만 만든다.
 *
 * SVG·GIF(최적화 대상이 아님)와 S3 밖 주소는 원본을 그대로 쓴다.
 * displayWidth를 주면 그 폭(px)으로 보이는 이미지로 본다.
 */
export function responsiveImage(
  url: string,
  displayWidth?: number,
): ResponsiveImage {
  const src = toPublicAssetUrl(url)
  if (!isAllowedImageUrl(url) || /\.(svg|gif)$/i.test(new URL(url).pathname)) {
    return { src }
  }
  const { props } = getImageProps({
    src,
    alt: '',
    width: displayWidth ?? 1920,
    height: displayWidth ?? 1080,
    sizes: displayWidth ? `${displayWidth}px` : CONTENT_IMAGE_SIZES,
  })
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes }
}

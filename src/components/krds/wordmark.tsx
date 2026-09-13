import NextImage from 'next/image'

export const LOGO_SRC = '/images/logo/stdev-logo.png'

/**
 * 원형 심벌 + "사단법인 STDev" 워드마크. 헤더 로고 링크와 푸터 로고가 함께 쓴다.
 * 심벌은 바로 뒤의 텍스트가 이름을 대신하므로 대체 텍스트를 비운다.
 * width/height는 표시 크기(4rem)다. 실제 크기는 CSS 토큰이 정한다.
 */
export default function Wordmark() {
  return (
    <>
      <NextImage
        className="stdev-symbol"
        src={LOGO_SRC}
        alt=""
        width={40}
        height={40}
      />
      사단법인 STDev
    </>
  )
}

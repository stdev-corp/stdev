/*
 * 어떤 라우트에도 맞지 않는 URL의 404 응답.
 *
 * 공개 사이트 (stdev)와 관리자 (cms)가 각자 루트 레이아웃을 가지므로 앱 공통의
 * not-found.tsx를 얹을 루트 레이아웃이 없다. Next.js는 이 경우를 위해
 * global-not-found를 제공하며(next.config.ts의 experimental.globalNotFound),
 * 레이아웃을 거치지 않고 이 파일이 돌려주는 문서 전체를 404 상태로 응답한다.
 * 그래서 공개 사이트의 루트 레이아웃(<html>, KRDS CSS, 분석 스크립트)과 404
 * 화면을 여기서 직접 조립한다.
 */
import RootLayout, { metadata } from './(stdev)/layout'
import NotFoundPage from './(stdev)/not-found'

export { metadata }

export default function GlobalNotFound() {
  return (
    <RootLayout>
      <NotFoundPage />
    </RootLayout>
  )
}

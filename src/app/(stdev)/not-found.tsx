import CenterScreen from '@/components/center-screen'
import SiteLayout from '@/components/krds/site-layout'

/**
 * 공개 사이트 404 화면. (stdev) 안에서 notFound()가 던져졌을 때와, 어떤 라우트에도
 * 맞지 않는 URL(app/global-not-found.tsx)에서 함께 쓴다. 가장 가까운 not-found
 * 경계가 (stdev) 루트라 구역 레이아웃은 그려지지 않으므로 여기서 셸을 직접 감싼다.
 */
export default async function NotFoundPage() {
  return (
    <SiteLayout breadcrumb={false}>
      <CenterScreen title="404 Not Found">
        <p>요청하신 페이지를 찾을 수 없습니다.</p>
        <p>URL을 다시 확인해 보세요.</p>
      </CenterScreen>
    </SiteLayout>
  )
}

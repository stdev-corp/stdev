import CenterScreen from '@/components/center-screen'

export default async function NotFoundPage() {
  return (
    <CenterScreen title="404 Not Found">
      <p>요청하신 페이지를 찾을 수 없습니다.</p>
      <p>URL을 다시 확인해 보세요.</p>
    </CenterScreen>
  )
}

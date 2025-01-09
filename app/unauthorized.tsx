import CenterScreen from '@/components/center-screen'

export default async function UnauthorizedPage() {
  return (
    <CenterScreen title="401 Unauthorized">
      <p>이 페이지에 접근할 권한이 없습니다.</p>
      <p>로그인이 필요한 페이지에 접근을 시도하셨다면 로그인해 보세요.</p>
    </CenterScreen>
  )
}

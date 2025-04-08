import CenterScreen from '@/components/center-screen'

export default async function ForbiddenPage() {
  return (
    <CenterScreen title="403 Forbidden">
      <p>이 페이지에 접근할 권한이 없습니다.</p>
      <p>관리자 페이지에 접근을 시도하셨다면 다른 계정으로 로그인해 보세요.</p>
    </CenterScreen>
  )
}

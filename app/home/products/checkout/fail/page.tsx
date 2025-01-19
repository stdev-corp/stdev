import CenterScreen from '@/components/center-screen'
import { Links } from '@/utils/links'
import { Button } from '@heroui/button'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ code: string; message: string }>
}

export default async function CheckoutFailPage(props: Props) {
  const { code, message } = await props.searchParams

  return (
    <CenterScreen title="결제 실패">
      <h1>결제 실패</h1>
      <p>결제에 실패하였습니다.</p>
      <p>code: {code}</p>
      <p>message: {message}</p>
      <Button as={Link} href={Links.products}>
        상품 목록으로 돌아가기
      </Button>
    </CenterScreen>
  )
}

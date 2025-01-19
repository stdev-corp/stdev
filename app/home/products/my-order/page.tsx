import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { redirect } from 'next/navigation'
import { Links } from '@/utils/links'
import { queryMyOrders } from '@/utils/server/order'

type Props = {
  searchParams: Promise<{
    name: string
    email: string
    phone: string
  }>
}

export default async function MyOrderPage(props: Props) {
  const { name, email, phone } = await props.searchParams

  if (!name || !email || !phone) {
    async function handleSubmit(formData: FormData) {
      'use server'
      const name = formData.get('name') as string
      const email = formData.get('email') as string
      const phone = formData.get('phone') as string

      const searchParams = new URLSearchParams({ name, email, phone })
      redirect(`${Links.productsMyOrder}?${searchParams.toString()}`)
    }

    return (
      <>
        <h1>내 주문 조회하기</h1>
        <p>주문 정보를 조회하려면 아래 정보를 정확하게 입력해주세요.</p>
        <div className="h-8" />
        <form className="flex flex-col gap-4">
          <Input name="name" label="이름" placeholder="홍길동" />
          <Input name="email" label="이메일" placeholder="sample@stdev.kr" />
          <Input name="phone" label="전화번호" placeholder="01012345678" />
          <Button type="submit" formAction={handleSubmit}>
            조회하기
          </Button>
        </form>
      </>
    )
  }

  const orders = await queryMyOrders(name, email, phone)

  return (
    <>
      <h1>내 주문 목록</h1>
      <p>아래는 {name}님의 주문 목록입니다.</p>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            <p>주문번호: {order.id}</p>
            <p>결제 상태: {order.status}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

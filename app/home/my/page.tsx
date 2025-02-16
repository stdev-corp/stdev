import BasicLayout from '@/components/layout/basic-layout'
import { auth } from '@/utils/auth'
import { Links } from '@/utils/links'
import { getOrders } from '@/utils/server/order'
import { Avatar } from '@heroui/avatar'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(Links.signin)
  }

  const orders = await getOrders(session.user.id)

  return (
    <BasicLayout>
      <h1>내 정보</h1>
      <div className="flex flex-row gap-8 items-center">
        <Avatar
          className="w-20 h-20 text-large"
          src={session.user.image ?? undefined}
        />
        <div>
          <p className="font-bold text-2xl">{session.user.name}</p>
          <p>{session.user.email}</p>
        </div>
      </div>
      <div className="h-8" />
      <h2>구매한 상품</h2>
      <div>
        {orders.map((order, index) => (
          <div key={index}>
            <h3>{order.product.name}</h3>
            <p>₩ {order.product.price}원</p>
            <p>소속: {order.affiliation}</p>
            <p>직위: {order.position}</p>
          </div>
        ))}
      </div>
    </BasicLayout>
  )
}

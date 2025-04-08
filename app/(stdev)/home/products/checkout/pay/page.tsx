import { getProduct } from '@/utils/server/product'
import TossWidget from './toss-widget'
import { getOrder } from '@/utils/server/order'
import ProductCard from '@/components/product-card'
import { notFound } from 'next/navigation'
import { auth, signIn } from '@/utils/auth'

type Props = {
  searchParams: Promise<{ orderId: string }>
}

export default async function CheckoutPage(props: Props) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    await signIn()
    return
  }

  const orderId = (await props.searchParams).orderId
  const order = await getOrder(orderId)

  if (!order) notFound()

  const product = await getProduct(order.productId)

  if (!product) notFound()

  return (
    <>
      <h1>상품 결제</h1>
      <div className="gap-12 grid grid-cols-1 lg:grid-cols-2">
        <div className="flex-1">
          <TossWidget product={product} order={order} userId={userId} />
        </div>
        <div className="hidden lg:block">
          <ProductCard product={product} isButton={false} />
        </div>
      </div>
    </>
  )
}

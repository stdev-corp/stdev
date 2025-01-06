import { getProduct } from '@/utils/server/product'
import TossWidget from './toss-widget'
import { getOrder } from '@/utils/server/order'
import ProductCard from '@/components/product-card'

type Props = {
  searchParams: Promise<{ orderId: string }>
}

export default async function CheckoutPage(props: Props) {
  const orderId = (await props.searchParams).orderId
  const order = await getOrder(orderId)

  if (!order) {
    return <div>주문이 없습니다.</div>
  }

  const product = await getProduct(order.productId)

  if (!product) {
    return <div>상품이 없습니다.</div>
  }

  return (
    <>
      <h1>상품 결제</h1>
      <div className="flex flex-row gap-8">
        <div className="flex-1">
          <TossWidget product={product} order={order} />
        </div>
        <ProductCard product={product} isButton={false} />
      </div>
    </>
  )
}

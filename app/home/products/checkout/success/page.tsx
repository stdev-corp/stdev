import ProductCard from '@/components/product-card'
import { confirmOrder } from '@/utils/server/order'
import { getProduct } from '@/utils/server/product'

type Props = {
  searchParams: Promise<{ orderId: string; paymentKey: string; amount: string }>
}

export default async function CheckoutSuccessPage(props: Props) {
  const { orderId, paymentKey, amount } = await props.searchParams

  const order = await confirmOrder(orderId, paymentKey, Number(amount))
  const product = await getProduct(order.productId)

  if (!product) {
    return <div>상품이 없습니다.</div>
  }

  return (
    <>
      <h1>결제 성공</h1>
      <h2>🎉 결제에 성공하였습니다.</h2>
      <div className="h-8" />
      <ProductCard product={product} isButton={false} />
    </>
  )
}

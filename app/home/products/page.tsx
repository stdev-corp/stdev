import ProductCard from '@/components/product-card'
import { queryProducts } from '@/utils/server/product'

export default async function OrderPage() {
  const products = await queryProducts()

  return (
    <>
      <h1>행사 참가 신청하기</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {products.map((product, index) => (
          <ProductCard product={product} key={index} isButton />
        ))}
      </div>
    </>
  )
}

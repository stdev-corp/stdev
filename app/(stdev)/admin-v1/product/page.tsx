import { Button } from '@heroui/button'
import ProductTable from './table'
import { queryProducts } from '@/utils/server/product'
import Link from 'next/link'
import { Links } from '@/utils/links'

export default async function AdminProductsPage() {
  const products = await queryProducts({})

  return (
    <>
      <h1>상품</h1>
      <Button as={Link} href={Links.adminProductCreate}>
        새 상품 등록하기
      </Button>
      <div className="h-8" />
      <ProductTable products={products} />
    </>
  )
}

import ProductCard from '@/components/product-card'
import { auth, signIn } from '@/utils/auth'
import { Links } from '@/utils/links'
import { createOrder } from '@/utils/server/order'
import { getProduct } from '@/utils/server/product'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { notFound, redirect } from 'next/navigation'

type Props = {
  searchParams: Promise<{ productId: string }>
}

export default async function CheckoutUserInfoPage(props: Props) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return await signIn()
  }

  const productId = (await props.searchParams).productId
  const product = await getProduct(productId)

  async function handleSubmit(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const affiliation = formData.get('affiliation') as string
    const position = formData.get('position') as string

    if (!userId) return

    const order = await createOrder({
      productId,
      userId,
      name,
      email,
      phone,
      affiliation,
      position,
    })

    if (!order) {
      redirect(Links.products)
    }

    redirect(Links.checkoutPay(order.id))
  }

  if (!product) notFound()

  return (
    <>
      <h1>상품 결제</h1>
      <div className="gap-12 grid grid-cols-1 lg:grid-cols-2">
        <form className="flex flex-col w-96 gap-4">
          <h2>주문자 정보</h2>
          <Input
            name="name"
            label="이름"
            defaultValue={session.user?.name ?? ''}
          />
          <Input
            name="email"
            label="이메일"
            type="email"
            defaultValue={session.user?.email ?? ''}
          />
          <Input name="phone" label="전화번호" placeholder="01012345678" />
          <Input name="affiliation" label="소속" placeholder="KAIST" />
          <Input name="position" label="직위" placeholder="전산학부 4학년" />
          <Button type="submit" formAction={handleSubmit}>
            다음
          </Button>
        </form>
        <ProductCard product={product} isButton={false} />
      </div>
    </>
  )
}

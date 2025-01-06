import { Input, Textarea } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { createProduct } from '@/utils/server/product'
import { redirect } from 'next/navigation'
import { Links } from '@/utils/links'

export default async function AdminProductCreatePage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price') as string)
    const image = formData.get('image') as string

    await createProduct({
      name,
      description,
      price,
      image,
    })

    redirect(Links.adminProduct)
  }

  return (
    <>
      <h1>새 상품 생성</h1>
      <form className="flex flex-col gap-4 max-w-2xl">
        <Input name="name" label="이름" placeholder="STDev Conference 2025" />
        <Textarea name="description" label="설명" />
        <Input name="price" label="가격" placeholder="숫자만 입력해 주세요" />
        <Input
          name="image"
          label="URL"
          placeholder="AWS S3 이미지 URL을 입력해 주세요."
        />
        <Button type="submit" formAction={handleSubmit}>
          생성
        </Button>
      </form>
    </>
  )
}

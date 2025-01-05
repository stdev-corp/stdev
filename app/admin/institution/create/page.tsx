import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { createInstitution } from '@/utils/server/institutions'
import { redirect } from 'next/navigation'
import { Links } from '@/utils/links'

export default async function AdminInstitutionCreatePage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const name = formData.get('name')
    const imageUrl = formData.get('imageUrl')

    if (typeof name !== 'string' || typeof imageUrl !== 'string') {
      return
    }

    await createInstitution(name, imageUrl)
    redirect(Links.adminInstitution)
  }

  return (
    <>
      <h1>기관 생성</h1>
      <form>
        <Input label="기관명" name="name" />
        <div className="h-4" />
        <Input label="로고 이미지 URL (AWS S3)" name="imageUrl" />
        <div className="h-4" />
        <Button type="submit" formAction={handleSubmit}>
          생성
        </Button>
      </form>
    </>
  )
}

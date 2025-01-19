import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { createEvent } from '@/utils/server/event'
import { redirect } from 'next/navigation'
import { Links } from '@/utils/links'

export default async function AdminEventCreatePage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const slug = formData.get('slug') as string
    const startDate = new Date(formData.get('startDate') as string)
    const endDate = new Date(formData.get('endDate') as string)
    const location = formData.get('location') as string

    await createEvent({
      title,
      slug,
      startDate,
      endDate,
      location,
    })

    redirect(Links.adminEvent)
  }

  return (
    <>
      <h1>새 행사 생성</h1>
      <form className="flex flex-col gap-4 max-w-xl">
        <Input label="행사 이름" name="title" />
        <Input label="행사 ID" name="slug" placeholder="SSH23" />
        <Input label="행사 시작 날짜" name="startDate" type="date" />
        <Input label="행사 종료 날짜" name="endDate" type="date" />
        <Input label="행사 위치" name="location" />
        <Button type="submit" formAction={handleSubmit}>
          생성
        </Button>
      </form>
    </>
  )
}

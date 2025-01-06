import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import WebpageTypeSelect from './webpage-type-select'
import { createWebpage } from '@/utils/server/webpage'
import { WebpageType } from '@prisma/client'
import { redirect } from 'next/navigation'
import { Links } from '@/utils/links'

export default async function AdminWebpageCreatePage() {
  async function handleSubmit(formData: FormData) {
    'use server'

    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const url = formData.get('url') as string
    const date = new Date(formData.get('date') as string)
    const type = formData.get('type') as WebpageType
    const eventSlug = formData.get('eventSlug') as string

    await createWebpage({
      title,
      author,
      url,
      date,
      type,
      eventSlug,
    })

    redirect(Links.adminWebpage)
  }

  return (
    <>
      <h1>새 웹페이지 추가</h1>
      <form className="flex flex-col gap-8 max-w-xl">
        <Input
          label="제목"
          name="title"
          placeholder="카이스트와 전국 대학생 공공 데이터 해커톤 대회 공동 개최"
        />
        <Input label="작성자" name="author" placeholder="대전광역시" />
        <Input
          label="URL"
          name="url"
          placeholder="https://www.daejeon.go.kr/drh/board/boardNormalView.do?boardId=normal_0189"
        />
        <Input label="게재일" name="date" type="date" />
        <WebpageTypeSelect />
        <Input label="이벤트 ID" name="eventSlug" placeholder="SSH23" />
        <Button type="submit" formAction={handleSubmit}>
          생성
        </Button>
      </form>
    </>
  )
}

import { Links } from '@/utils/links'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { redirect, unauthorized } from 'next/navigation'
import { createRedirect } from '@/utils/server/redirect'
import { auth } from '@/utils/auth'

export default async function CreateMarkdownPage() {
  const session = await auth()

  const handleCreate = async (formData: FormData) => {
    'use server'
    if (!session?.user?.id) {
      unauthorized()
    }

    const slug = formData.get('slug') as string
    const url = formData.get('url') as string

    await createRedirect(slug, url, session.user.id)
    redirect(Links.adminRedirect)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">단축 URL 생성</h1>
      <div className="h-4" />
      <form className="flex flex-col gap-4">
        <Input placeholder="Slug" name="slug" />
        <p>https://stdev.kr/[slug] 로 생성됩니다.</p>
        <Input placeholder="URL" name="url" />
        <p>리다이렉트할 전체 주소를 입력해 주세요.</p>
        <Button type="submit" formAction={handleCreate}>
          생성
        </Button>
      </form>
    </div>
  )
}

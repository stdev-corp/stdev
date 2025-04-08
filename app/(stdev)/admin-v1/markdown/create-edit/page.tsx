import { Links } from '@/utils/links'
import {
  createMarkdown,
  getMarkdownById,
  updateMarkdown,
} from '@/utils/server/markdown'
import { Input, Textarea } from '@heroui/input'
import { Button } from '@heroui/button'
import { notFound, redirect } from 'next/navigation'

type Props = {
  searchParams: Promise<{ id: string }>
}

export default async function CreateMarkdownPage(props: Props) {
  const { id } = await props.searchParams

  let markdown
  if (id) {
    markdown = await getMarkdownById(id)
  }

  if (id && !markdown) {
    return notFound()
  }

  const handleCreate = async (formData: FormData) => {
    'use server'
    const category = formData.get('category') as string
    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string
    const content = formData.get('content') as string

    if (!id) {
      await createMarkdown({ category, title, subtitle, content })
    } else {
      await updateMarkdown(id, { category, title, subtitle, content })
    }

    redirect(Links.adminMarkdown)
  }

  return (
    <div className="container mx-auto p-4">
      <h1>{id ? '마크다운 편집' : '마크다운 생성'}</h1>
      {id && <div>ID: {id}</div>}
      <div className="h-8" />
      <form className="flex flex-col gap-4">
        <Input
          placeholder="Category"
          name="category"
          label="카테고리"
          defaultValue={markdown?.category}
        />
        <Input
          placeholder="Title"
          name="title"
          label="제목"
          defaultValue={markdown?.title}
        />
        <Input
          placeholder="Subtitle"
          name="subtitle"
          label="부제목"
          defaultValue={markdown?.subtitle ?? ''}
        />
        <Textarea
          placeholder="Write your markdown here"
          name="content"
          label="내용"
          size="lg"
          defaultValue={markdown?.content ?? ''}
        />
        <Button type="submit" formAction={handleCreate}>
          {id ? '수정' : '생성'}
        </Button>
      </form>
    </div>
  )
}

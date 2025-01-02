import { Links } from '@/utils/links'
import { createMarkdown } from '@/utils/server/markdown'
import { Input, Textarea } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { redirect } from 'next/navigation'

export default function CreateMarkdownPage() {
  const handleCreate = async (formData: FormData) => {
    'use server'
    const category = formData.get('category') as string
    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string
    const content = formData.get('content') as string

    await createMarkdown({ category, title, subtitle, content })
    redirect(Links.root)
  }

  return (
    <div className="container mx-auto p-4">
      <h1>Create Markdown Page</h1>
      <form className="flex flex-col gap-4">
        <Input placeholder="Category" name="category" />
        <Input placeholder="Title" name="title" />
        <Input placeholder="Subtitle" name="subtitle" />
        <Textarea
          placeholder="Write your markdown here"
          name="content"
          height="600px"
        />
        <Button type="submit" formAction={handleCreate}>
          생성
        </Button>
      </form>
    </div>
  )
}

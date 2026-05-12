import { prisma } from '@/utils/prisma'
import { MarkdownListClient } from '@/components/admin/entity-forms/markdown-list-client'
import {
  createMarkdown,
  deleteMarkdown,
  updateMarkdown,
} from '@/app/(cms)/admin/actions'

export default async function MarkdownsPage() {
  const markdowns = await prisma.markdown.findMany({
    orderBy: { effectiveDate: 'desc' },
  })
  return (
    <MarkdownListClient
      markdowns={markdowns}
      actions={{ createMarkdown, updateMarkdown, deleteMarkdown }}
    />
  )
}

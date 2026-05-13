import { prisma } from '@/utils/prisma'
import { WebpageListClient } from '@/components/admin/entity-forms/webpage-list-client'
import {
  createWebpage,
  deleteWebpage,
  updateWebpage,
} from '@/app/(cms)/admin/actions'

export default async function WebpagesPage() {
  const [webpages, businesses] = await Promise.all([
    prisma.webpage.findMany({
      orderBy: { publishedDate: 'desc' },
    }),
    prisma.business.findMany({
      orderBy: { id: 'asc' },
    }),
  ])
  return (
    <WebpageListClient
      webpages={webpages}
      businesses={businesses}
      actions={{ createWebpage, updateWebpage, deleteWebpage }}
    />
  )
}

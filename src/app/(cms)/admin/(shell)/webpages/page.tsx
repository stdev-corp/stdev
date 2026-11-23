import { prisma } from '@/utils/prisma'
import { WebpageListClient } from '@/components/admin/entity-forms/webpage-list-client'
import {
  createWebpage,
  deleteWebpage,
  updateWebpage,
} from '@/app/(cms)/admin/actions'

export default async function WebpagesPage() {
  const [webpages, businesses, files] = await Promise.all([
    prisma.webpage.findMany({
      include: { archive: true },
      orderBy: { publishedDate: 'desc' },
    }),
    prisma.business.findMany({
      orderBy: { id: 'asc' },
    }),
    // 저장본 고르기: 최근에 올린 파일이 위에 오도록
    prisma.fileAsset.findMany({
      orderBy: { id: 'desc' },
    }),
  ])
  return (
    <WebpageListClient
      webpages={webpages}
      businesses={businesses}
      files={files}
      actions={{ createWebpage, updateWebpage, deleteWebpage }}
    />
  )
}

import { prisma } from '@/utils/prisma'
import { BusinessPageListClient } from '@/components/admin/entity-forms/business-page-list-client'
import {
  createBusinessPage,
  deleteBusinessPage,
  updateBusinessPage,
} from '@/app/(cms)/admin/actions'

export default async function BusinessPagesPage() {
  const [pages, businesses, images] = await Promise.all([
    prisma.businessPage.findMany({
      orderBy: [{ businessId: 'asc' }, { path: 'asc' }],
    }),
    prisma.business.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    }),
    prisma.imageAsset.findMany({
      select: { id: true, filename: true, url: true },
      orderBy: { id: 'asc' },
    }),
  ])
  return (
    <BusinessPageListClient
      pages={pages}
      businesses={businesses}
      images={images}
      actions={{ createBusinessPage, updateBusinessPage, deleteBusinessPage }}
    />
  )
}

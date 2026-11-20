import { prisma } from '@/utils/prisma'
import { BusinessListClient } from '@/components/admin/entity-forms/business-list-client'
import {
  createBusiness,
  deleteBusiness,
  updateBusiness,
} from '@/app/(cms)/admin/actions'

export default async function BusinessesPage() {
  const [businesses, institutions, images] = await Promise.all([
    prisma.business.findMany({
      include: {
        institutions: {
          select: { institutionId: true, role: true, sortOrder: true },
        },
      },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    }),
    prisma.institution.findMany({
      select: { id: true, nameKo: true },
      orderBy: { nameKo: 'asc' },
    }),
    prisma.imageAsset.findMany({
      select: { id: true, filename: true, url: true },
      orderBy: { id: 'asc' },
    }),
  ])
  return (
    <BusinessListClient
      businesses={businesses}
      institutions={institutions}
      images={images}
      actions={{ createBusiness, updateBusiness, deleteBusiness }}
    />
  )
}

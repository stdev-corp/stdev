import { prisma } from '@/utils/prisma'
import { BusinessListClient } from '@/components/admin/entity-forms/business-list-client'
import {
  createBusiness,
  deleteBusiness,
  updateBusiness,
} from '@/app/(cms)/admin/actions'

export default async function BusinessesPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { id: 'asc' },
  })
  return (
    <BusinessListClient
      businesses={businesses}
      actions={{ createBusiness, updateBusiness, deleteBusiness }}
    />
  )
}

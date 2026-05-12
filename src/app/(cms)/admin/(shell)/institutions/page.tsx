import { prisma } from '@/utils/prisma'
import { InstitutionListClient } from '@/components/admin/entity-forms/institution-list-client'
import {
  createInstitution,
  deleteInstitution,
  updateInstitution,
} from '@/app/(cms)/admin/actions'

export default async function InstitutionsPage() {
  const [institutions, images] = await Promise.all([
    prisma.institution.findMany({
      orderBy: { id: 'asc' },
    }),
    prisma.imageAsset.findMany({
      orderBy: { id: 'asc' },
    }),
  ])
  return (
    <InstitutionListClient
      institutions={institutions}
      images={images}
      actions={{ createInstitution, updateInstitution, deleteInstitution }}
    />
  )
}

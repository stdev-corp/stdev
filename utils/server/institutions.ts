import { prisma } from '../prisma'

export async function queryInstitutions() {
  const institutions = await prisma.institution.findMany()
  return institutions
}

export async function createInstitution(name: string, imageUrl: string) {
  const institution = await prisma.institution.create({
    data: {
      name,
      imageUrl,
    },
  })
  return institution
}

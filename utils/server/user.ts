import { prisma } from '../prisma'

export async function listUsers() {
  const data = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return data
}

export async function getUserCount() {
  const all = await prisma.user.count()
  const corporation = await prisma.user.count({
    where: { email: { endsWith: '@stdev.kr' } },
  })
  return { all, corporation }
}

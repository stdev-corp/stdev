import { prisma } from '../prisma'

export async function createRedirect(
  slug: string,
  url: string,
  userId: string,
) {
  return prisma.redirect.create({
    data: {
      slug,
      url,
      userId,
    },
  })
}

export async function getUrlBySlug(slug: string) {
  const data = await prisma.redirect.findUnique({
    where: { slug },
  })

  if (data?.deletedAt) {
    return undefined
  }

  return data?.url
}

export async function listRedirectsWithUser() {
  return prisma.redirect.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  })
}

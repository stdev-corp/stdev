import { WebpageType } from '@prisma/client'
import { prisma } from '../prisma'

export async function queryWebpages(type?: WebpageType) {
  const data = await prisma.webpage.findMany({
    where: type ? { type } : {},
    orderBy: {
      date: 'desc',
    },
    select: {
      id: true,
      title: true,
      author: true,
      url: true,
      date: true,
      type: true,
      event: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  })
  return data
}

type CreateWebpageInput = {
  title: string
  author: string
  url: string
  date: Date
  type: WebpageType
  eventSlug: string
}

export async function createWebpage(data: CreateWebpageInput) {
  const webpage = await prisma.webpage.create({
    data: {
      title: data.title,
      author: data.author,
      url: data.url,
      date: data.date,
      type: data.type,
      event: {
        connect: {
          slug: data.eventSlug,
        },
      },
    },
  })
  return webpage
}

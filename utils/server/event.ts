import { prisma } from '../prisma'

export async function queryEvents() {
  const data = await prisma.event.findMany()
  return data
}

type CreateEventInput = {
  title: string
  slug: string
  startDate: Date
  endDate: Date
  location: string
}

export async function createEvent(data: CreateEventInput) {
  const event = await prisma.event.create({
    data,
  })
  return event
}

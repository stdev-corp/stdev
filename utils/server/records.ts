import { RecordType } from '@prisma/client'
import { prisma } from '../prisma'

export async function queryRecords() {
  const data = await prisma.record.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
  return data
}

type CreateRecordInput = {
  type: RecordType
  title: string
  date: Date
  pdfUrl: string
}

export async function createRecord(data: CreateRecordInput) {
  const record = await prisma.record.create({
    data,
  })
  return record
}

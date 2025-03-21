import { PrismaClient, RecordType } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export type Model = 'redirect' | 'user'

export function toRecordTypeString(recordType: RecordType) {
  switch (recordType) {
    case RecordType.GENERAL_MEETING:
      return '총회'
    case RecordType.BOARD_MEETING:
      return '이사회'
  }
}

export function toRecordType(recordTypeString: string): RecordType | undefined {
  switch (recordTypeString) {
    case '총회':
      return RecordType.GENERAL_MEETING
    case '이사회':
      return RecordType.BOARD_MEETING
  }
}

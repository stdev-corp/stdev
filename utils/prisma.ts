import { PrismaClient, RecordType } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export type Model = 'redirect' | 'user'

export function toRecordTypeString(recordType: RecordType) {
  switch (recordType) {
    case RecordType.REGULAR_GENERAL_MEETING:
      return '정기 총회'
    case RecordType.EXTRAORDINARY_GENERAL_MEETING:
      return '임시 총회'
    case RecordType.INAUGURAL_GENERAL_MEETING:
      return '창립 총회'
    case RecordType.REGULAR_BOARD_MEETING:
      return '정기 이사회'
    case RecordType.EXTRAORDINARY_BOARD_MEETING:
      return '임시 이사회'
  }
}

export function toRecordType(recordTypeString: string): RecordType | undefined {
  switch (recordTypeString) {
    case '정기 총회':
      return RecordType.REGULAR_GENERAL_MEETING
    case '임시 총회':
      return RecordType.EXTRAORDINARY_GENERAL_MEETING
    case '창립 총회':
      return RecordType.INAUGURAL_GENERAL_MEETING
    case '정기 이사회':
      return RecordType.REGULAR_BOARD_MEETING
    case '임시 이사회':
      return RecordType.EXTRAORDINARY_BOARD_MEETING
  }
}

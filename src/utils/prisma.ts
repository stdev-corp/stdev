import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { withDatabaseSslParams } from '@/utils/database-url'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const databaseHost = new URL(databaseUrl).hostname
const databaseSslRejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED
const isLocalDatabase =
  databaseHost === 'localhost' || databaseHost === '127.0.0.1'
const ssl =
  databaseSslRejectUnauthorized === 'false'
    ? { rejectUnauthorized: false }
    : databaseSslRejectUnauthorized === 'true' || !isLocalDatabase
      ? { rejectUnauthorized: true }
      : undefined

const adapter = new PrismaPg({
  connectionString: withDatabaseSslParams(databaseUrl),
})

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

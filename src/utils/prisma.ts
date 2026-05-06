import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.DATABASE_URL
const databaseSslRejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: databaseSslRejectUnauthorized,
  },
})

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

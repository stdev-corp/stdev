import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import type { TestFixture } from '@playwright/test'

export type DatabaseFixture = TestFixture<void, object>

function createClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for E2E tests')
  }

  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({ adapter })
}

export async function isDatabaseAvailable() {
  const prisma = createClient()

  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  } finally {
    await prisma.$disconnect()
  }
}

export async function resetDatabase() {
  const prisma = createClient()

  try {
    await prisma.$transaction([
      prisma.webpage.deleteMany(),
      prisma.report.deleteMany(),
      prisma.history.deleteMany(),
      prisma.institution.deleteMany(),
      prisma.imageAsset.deleteMany(),
      prisma.fileAsset.deleteMany(),
      prisma.markdown.deleteMany(),
      prisma.business.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.user.deleteMany(),
      prisma.verification.deleteMany(),
    ])
  } finally {
    await prisma.$disconnect()
  }
}

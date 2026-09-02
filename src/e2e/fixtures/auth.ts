import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { randomBytes, createHmac } from 'node:crypto'
import type { BrowserContext } from '@playwright/test'

function createClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for E2E tests')
  }

  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({ adapter })
}

export async function seedAdminSession(context: BrowserContext) {
  const prisma = createClient()
  const unique = Date.now()
  const userId = `user-admin-${unique}`
  const sessionId = `session-${unique}`
  const token = randomBytes(32).toString('hex')

  try {
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Test Admin',
        email: 'e2e@stdev.kr',
        emailVerified: true,
      },
    })
    await prisma.account.create({
      data: {
        id: `acc-${userId}`,
        issuer: 'https://accounts.google.com',
        accountId: 'google-acc',
        providerId: 'google',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        token,
        expiresAt: new Date(Date.now() + 3600_000),
        ipAddress: '127.0.0.1',
        userAgent: 'playwright',
      },
    })

    const secret =
      process.env.BETTER_AUTH_SECRET ?? 'test-better-auth-secret-32-chars-min'
    const signature = createHmac('sha256', secret)
      .update(token)
      .digest('base64url')
    const cookieValue = `${token}.${signature}`

    // better-auth session cookie details can change by version. If this bypass
    // stops authenticating, keep OAuth covered by admin-signin.spec.ts and skip
    // admin CRUD smoke until the current cookie format is re-confirmed.
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: cookieValue,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 3600,
      },
    ])

    return { userId, sessionId }
  } finally {
    await prisma.$disconnect()
  }
}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { randomBytes } from 'node:crypto'
import { getCookies } from 'better-auth/cookies'
import { makeSignature } from 'better-auth/crypto'
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
    // A retried test seeds again with the same email and Google account id, so
    // clear the previous run's admin first (its accounts and sessions cascade).
    await prisma.user.deleteMany({ where: { email: 'e2e@stdev.kr' } })
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

    const secret = process.env.BETTER_AUTH_SECRET

    if (!secret) {
      throw new Error('BETTER_AUTH_SECRET is required for E2E tests')
    }

    // Name and sign the cookie with better-auth's own helpers so it matches
    // what the server verifies: the server rejects anything but a 44-character
    // padded base64 HMAC, and the name gains a __Secure- prefix on https.
    const { sessionToken } = getCookies({
      baseURL: process.env.BETTER_AUTH_URL,
      secret,
    })
    const signature = await makeSignature(token, secret)

    await context.addCookies([
      {
        name: sessionToken.name,
        value: encodeURIComponent(`${token}.${signature}`),
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

import { APIError, createAuthMiddleware } from 'better-auth/api'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@/utils/prisma'

const adminEmailSuffix = '@stdev.kr'

function requiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

export const auth = betterAuth({
  secret: requiredEnv('BETTER_AUTH_SECRET'),
  baseURL: requiredEnv('BETTER_AUTH_URL'),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    google: {
      clientId: requiredEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET'),
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/callback/google' && ctx.path !== '/sign-in/social') {
        return
      }

      const newSession = ctx.context.newSession

      if (!newSession) {
        return
      }

      if (!newSession.user.email.toLowerCase().endsWith(adminEmailSuffix)) {
        await prisma.session.deleteMany({
          where: { userId: newSession.user.id },
        })

        throw APIError.from('FORBIDDEN', {
          code: 'UNAUTHORIZED_ADMIN_DOMAIN',
          message: 'Only @stdev.kr Google accounts can access admin.',
        })
      }
    }),
  },
  plugins: [nextCookies()],
})

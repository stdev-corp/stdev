import { prisma } from '@/utils/prisma'
import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!clientId) {
  throw new Error('GOOGLE_CLIENT_ID is not set')
}
if (!clientSecret) {
  throw new Error('GOOGLE_CLIENT_SECRET is not set')
}

const googleProvider = GoogleProvider({
  clientId,
  clientSecret,
})

const options: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [googleProvider],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
}

const handler = NextAuth(options)

export { handler as GET, handler as POST }

import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/utils/prisma'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import LinkedIn from 'next-auth/providers/linkedin'
import { Provider } from 'next-auth/providers'

const providers: Provider[] = [Google, GitHub, LinkedIn]

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === 'function') {
      const providerData = provider()
      return { id: providerData.id, name: providerData.name }
    } else {
      return { id: provider.id, name: provider.name }
    }
  })
  .filter((provider) => provider.id !== 'credentials')

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true,
})

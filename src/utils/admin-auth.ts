import { headers } from 'next/headers'
import { forbidden, redirect } from 'next/navigation'
import { auth } from '@/utils/auth'
import { prisma } from '@/utils/prisma'

const adminEmailSuffix = '@stdev.kr'

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

async function hasGoogleAccount(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'google',
    },
    select: {
      id: true,
    },
  })

  return Boolean(account)
}

async function isAllowedAdmin(user: { id: string; email: string }) {
  return (
    user.email.toLowerCase().endsWith(adminEmailSuffix) &&
    (await hasGoogleAccount(user.id))
  )
}

export async function requireAdminPageSession() {
  const session = await getSession()

  if (!session) {
    redirect('/admin/sign-in')
  }

  if (!(await isAllowedAdmin(session.user))) {
    forbidden()
  }

  return session
}

export async function requireAdminActionSession() {
  const session = await getSession()

  if (!session || !(await isAllowedAdmin(session.user))) {
    forbidden()
  }

  return session
}

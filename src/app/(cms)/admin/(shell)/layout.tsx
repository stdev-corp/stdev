import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdminPageSession } from '@/utils/admin-auth'

export default async function AdminShellLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await requireAdminPageSession()
  return <AdminShell sessionEmail={session.user.email}>{children}</AdminShell>
}

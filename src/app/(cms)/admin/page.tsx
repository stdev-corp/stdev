import { AdminDashboard } from '@/components/admin/dashboard'
import { requireAdminPageSession } from '@/utils/admin-auth'
import { prisma } from '@/utils/prisma'
import * as actions from './actions'

export default async function AdminPage() {
  const session = await requireAdminPageSession()

  const [
    businesses,
    images,
    files,
    institutions,
    markdowns,
    webpages,
    reports,
    histories,
  ] = await Promise.all([
    prisma.business.findMany({ orderBy: { id: 'asc' } }),
    prisma.imageAsset.findMany({ orderBy: { id: 'asc' } }),
    prisma.fileAsset.findMany({ orderBy: { id: 'asc' } }),
    prisma.institution.findMany({ orderBy: { id: 'asc' } }),
    prisma.markdown.findMany({ orderBy: { effectiveDate: 'desc' } }),
    prisma.webpage.findMany({ orderBy: { publishedDate: 'desc' } }),
    prisma.report.findMany({ orderBy: { publishedDate: 'desc' } }),
    prisma.history.findMany({ orderBy: { date: 'desc' } }),
  ])

  return (
    <AdminDashboard
      sessionEmail={session.user.email}
      businesses={businesses}
      images={images}
      files={files}
      institutions={institutions}
      markdowns={markdowns}
      webpages={webpages}
      reports={reports}
      histories={histories}
      actions={actions}
    />
  )
}

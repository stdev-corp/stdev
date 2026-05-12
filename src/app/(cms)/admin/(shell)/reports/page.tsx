import { prisma } from '@/utils/prisma'
import { ReportListClient } from '@/components/admin/entity-forms/report-list-client'
import {
  createReport,
  deleteReport,
  updateReport,
} from '@/app/(cms)/admin/actions'

export default async function ReportsPage() {
  const [reports, files] = await Promise.all([
    prisma.report.findMany({
      orderBy: { publishedDate: 'desc' },
    }),
    prisma.fileAsset.findMany({
      orderBy: { id: 'asc' },
    }),
  ])
  return (
    <ReportListClient
      reports={reports}
      files={files}
      actions={{ createReport, updateReport, deleteReport }}
    />
  )
}

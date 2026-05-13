'use client'

import { Text } from '@chakra-ui/react'
import type { FileAsset, Report } from '@prisma/client'
import { toDateString } from '@/utils/datetime'
import { EntityList } from '../entity-list'
import { ReportFormDrawer } from './report-form'

type Actions = {
  createReport: (formData: FormData) => Promise<void>
  updateReport: (formData: FormData) => Promise<void>
  deleteReport: (formData: FormData) => Promise<void>
}

function reportTypeLabel(type: Report['type']) {
  return type === 'meeting' ? '총회 및 이사회' : '기부금 모금액 및 활용실적'
}

export function ReportListClient({
  reports,
  files,
  actions,
}: {
  reports: Report[]
  files: FileAsset[]
  actions: Actions
}) {
  return (
    <EntityList
      title="보고서"
      description="총회, 이사회, 기부금 관련 보고서 파일을 관리합니다."
      items={reports}
      deleteAction={actions.deleteReport}
      deleteLabel="보고서"
      renderItem={(report) => (
        <>
          <Text fontWeight="semibold">
            #{report.id} · {report.title}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {reportTypeLabel(report.type)} ·{' '}
            {toDateString(report.publishedDate)}
          </Text>
        </>
      )}
      renderCreate={(open, setOpen) => (
        <ReportFormDrawer
          open={open}
          onOpenChange={setOpen}
          files={files}
          action={actions.createReport}
        />
      )}
      renderEdit={(report, open, closeEdit) => (
        <ReportFormDrawer
          open={open}
          onOpenChange={(next) => {
            if (!next) closeEdit()
          }}
          report={report ?? undefined}
          files={files}
          action={actions.updateReport}
        />
      )}
    />
  )
}

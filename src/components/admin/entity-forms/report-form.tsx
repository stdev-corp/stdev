'use client'

import { Field, Input, NativeSelect, Stack } from '@chakra-ui/react'
import type { FileAsset, Report } from '@prisma/client'
import { dateValue } from '@/utils/admin-format'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  report?: Report
  files: FileAsset[]
  action: (formData: FormData) => Promise<void>
}

export function ReportFormDrawer({
  open,
  onOpenChange,
  report,
  files,
  action,
}: Props) {
  const editing = Boolean(report)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `보고서 수정 #${report?.id}` : '보고서 추가'}
      action={action}
    >
      {editing && <input type="hidden" name="id" value={report?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>유형</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="type"
              defaultValue={report?.type ?? 'meeting'}
            >
              <option value="meeting">총회 및 이사회</option>
              <option value="donation">기부금 모금액 및 활용실적</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root required>
          <Field.Label>제목</Field.Label>
          <Input name="title" defaultValue={report?.title ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>게시일</Field.Label>
          <Input
            name="publishedDate"
            type="date"
            defaultValue={report ? dateValue(report.publishedDate) : ''}
            required
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>파일</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="fileId"
              defaultValue={report?.fileId ?? ''}
            >
              <option value="">파일 선택</option>
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  #{file.id} {file.filename}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

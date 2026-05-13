'use client'

import { Field, Input, Stack } from '@chakra-ui/react'
import type { FileAsset } from '@prisma/client'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  file?: FileAsset
  action: (formData: FormData) => Promise<void>
}

export function FileFormDrawer({ open, onOpenChange, file, action }: Props) {
  const editing = Boolean(file)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `파일 수정 #${file?.id}` : '파일 추가'}
      action={action}
      formKey={file?.id ?? 'create'}
    >
      {editing && <input type="hidden" name="id" value={file?.id} />}
      <Stack gap={4}>
        <Field.Root>
          <Field.Label>URL</Field.Label>
          <Input
            name="url"
            defaultValue={file?.url ?? ''}
            placeholder="기존 S3 PDF URL"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>파일</Field.Label>
          <Input name="file" type="file" accept="application/pdf" />
        </Field.Root>
        <Field.Root required>
          <Field.Label>파일명</Field.Label>
          <Input name="filename" defaultValue={file?.filename ?? ''} required />
        </Field.Root>
        <Field.Root>
          <Field.Label>MIME 타입</Field.Label>
          <Input name="mimeType" defaultValue={file?.mimeType ?? ''} />
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

'use client'

import { Field, Input, NativeSelect, Stack, Textarea } from '@chakra-ui/react'
import type { History, ImageAsset } from '@prisma/client'
import { dateValue } from '@/utils/admin-format'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  history?: History
  images: ImageAsset[]
  action: (formData: FormData) => Promise<void>
}

export function HistoryFormDrawer({
  open,
  onOpenChange,
  history,
  images,
  action,
}: Props) {
  const editing = Boolean(history)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `연혁 수정 #${history?.id}` : '연혁 추가'}
      action={action}
    >
      {editing && <input type="hidden" name="id" value={history?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>일자</Field.Label>
          <Input
            name="date"
            type="date"
            defaultValue={history ? dateValue(history.date) : ''}
            required
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>제목</Field.Label>
          <Input name="title" defaultValue={history?.title ?? ''} required />
        </Field.Root>
        <Field.Root>
          <Field.Label>내용</Field.Label>
          <Textarea
            name="content"
            rows={5}
            defaultValue={history?.content ?? ''}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>이미지</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="imageId"
              defaultValue={history?.imageId ?? ''}
            >
              <option value="">이미지 없음</option>
              {images.map((image) => (
                <option key={image.id} value={image.id}>
                  #{image.id} {image.filename ?? image.url}
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

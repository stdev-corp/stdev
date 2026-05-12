'use client'

import { Field, Input, Stack } from '@chakra-ui/react'
import type { ImageAsset } from '@prisma/client'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  image?: ImageAsset
  action: (formData: FormData) => Promise<void>
}

export function ImageFormDrawer({ open, onOpenChange, image, action }: Props) {
  const editing = Boolean(image)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `이미지 수정 #${image?.id}` : '이미지 추가'}
      action={action}
    >
      {editing && <input type="hidden" name="id" value={image?.id} />}
      <Stack gap={4}>
        <Field.Root>
          <Field.Label>URL</Field.Label>
          <Input
            name="url"
            defaultValue={image?.url ?? ''}
            placeholder="기존 S3 이미지 URL"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>파일</Field.Label>
          <Input name="file" type="file" accept="image/*" />
        </Field.Root>
        <Field.Root>
          <Field.Label>파일명</Field.Label>
          <Input name="filename" defaultValue={image?.filename ?? ''} />
        </Field.Root>
        <Field.Root>
          <Field.Label>대체 텍스트</Field.Label>
          <Input name="alt" defaultValue={image?.alt ?? ''} />
        </Field.Root>
        <Field.Root>
          <Field.Label>MIME 타입</Field.Label>
          <Input name="mimeType" defaultValue={image?.mimeType ?? ''} />
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

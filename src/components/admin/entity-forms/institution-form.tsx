'use client'

import { Field, Input, NativeSelect, Stack } from '@chakra-ui/react'
import type { ImageAsset, Institution } from '@prisma/client'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  institution?: Institution
  images: ImageAsset[]
  action: (formData: FormData) => Promise<void>
}

export function InstitutionFormDrawer({
  open,
  onOpenChange,
  institution,
  images,
  action,
}: Props) {
  const editing = Boolean(institution)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `기관 수정 #${institution?.id}` : '기관 추가'}
      action={action}
    >
      {editing && <input type="hidden" name="id" value={institution?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>국문명</Field.Label>
          <Input name="nameKo" defaultValue={institution?.nameKo ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>영문명</Field.Label>
          <Input name="nameEn" defaultValue={institution?.nameEn ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>URL</Field.Label>
          <Input name="url" defaultValue={institution?.url ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>로고 이미지</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="logoId"
              defaultValue={institution?.logoId ?? ''}
            >
              <option value="">이미지 선택</option>
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

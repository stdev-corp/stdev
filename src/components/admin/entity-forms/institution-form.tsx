'use client'

import { Checkbox, Field, Input, NativeSelect, Stack } from '@chakra-ui/react'
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
      formKey={institution?.id ?? 'create'}
    >
      {editing && <input type="hidden" name="id" value={institution?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>국문명</Field.Label>
          <Input
            name="nameKo"
            defaultValue={institution?.nameKo ?? ''}
            required
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>영문명</Field.Label>
          <Input name="nameEn" defaultValue={institution?.nameEn ?? ''} />
        </Field.Root>
        <Field.Root>
          <Field.Label>URL</Field.Label>
          <Input name="url" defaultValue={institution?.url ?? ''} />
          <Field.HelperText>
            있으면 행사 페이지에서 기관 이름에 링크가 걸립니다.
          </Field.HelperText>
        </Field.Root>
        <Field.Root>
          <Field.Label>로고 이미지</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="logoId"
              defaultValue={institution?.logoId ?? ''}
            >
              <option value="">로고 없음</option>
              {images.map((image) => (
                <option key={image.id} value={image.id}>
                  #{image.id} {image.filename ?? image.url}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Checkbox.Root
          name="showOnHome"
          defaultChecked={institution?.showOnHome ?? true}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>
            홈 &lsquo;함께하는 기관&rsquo; 로고 흐름에 보이기(로고 필요)
          </Checkbox.Label>
        </Checkbox.Root>
      </Stack>
    </FormDrawer>
  )
}

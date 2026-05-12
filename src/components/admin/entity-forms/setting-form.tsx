'use client'

import { Field, Input, Stack } from '@chakra-ui/react'
import type { AdminSettings } from '@prisma/client'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  setting?: AdminSettings
  action: (formData: FormData) => Promise<void>
}

export function SettingFormDrawer({
  open,
  onOpenChange,
  setting,
  action,
}: Props) {
  const editing = Boolean(setting)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `설정 수정: ${setting?.key}` : '설정 추가'}
      action={action}
    >
      {editing && <input type="hidden" name="id" value={setting?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>키</Field.Label>
          <Input
            name="key"
            defaultValue={setting?.key ?? ''}
            disabled={editing}
            placeholder="예: AWS_ACCESS_KEY_ID"
            required
          />
          {editing && (
            <Field.HelperText>키는 변경할 수 없습니다.</Field.HelperText>
          )}
        </Field.Root>
        <Field.Root required={!editing}>
          <Field.Label>값</Field.Label>
          <Input
            name="value"
            type="password"
            placeholder={
              editing ? '새 값을 입력하면 변경됩니다' : '값을 입력하세요'
            }
            required={!editing}
          />
          <Field.HelperText>
            {editing
              ? '비워두면 기존 값이 유지됩니다. 저장된 값은 서버 외부로 노출되지 않습니다.'
              : '저장된 값은 서버 외부로 노출되지 않습니다.'}
          </Field.HelperText>
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

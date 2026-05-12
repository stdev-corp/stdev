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
            <Field.HelpText>키는 변경할 수 없습니다.</Field.HelpText>
          )}
        </Field.Root>
        <Field.Root required>
          <Field.Label>값</Field.Label>
          <Input
            name="value"
            type="password"
            defaultValue={setting?.value ?? ''}
            required
          />
          <Field.HelpText>
            저장된 값은 관리자만 확인할 수 있습니다.
          </Field.HelpText>
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

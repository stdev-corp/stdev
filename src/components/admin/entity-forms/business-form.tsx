'use client'

import { Field, Input, Stack } from '@chakra-ui/react'
import type { Business } from '@prisma/client'
import { dateValue } from '@/utils/admin-format'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  business?: Business
  action: (formData: FormData) => Promise<void>
}

export function BusinessFormDrawer({
  open,
  onOpenChange,
  business,
  action,
}: Props) {
  const editing = Boolean(business)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `사업 수정 #${business?.id}` : '사업 추가'}
      action={action}
      formKey={business?.id ?? 'create'}
    >
      {editing && <input type="hidden" name="id" value={business?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>이름</Field.Label>
          <Input name="name" defaultValue={business?.name ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>코드</Field.Label>
          <Input name="code" defaultValue={business?.code ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>시작일</Field.Label>
          <Input
            name="startDate"
            type="date"
            defaultValue={business ? dateValue(business.startDate) : ''}
            required
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>종료일</Field.Label>
          <Input
            name="endDate"
            type="date"
            defaultValue={business ? dateValue(business.endDate) : ''}
            required
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>장소</Field.Label>
          <Input name="location" defaultValue={business?.location ?? ''} />
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

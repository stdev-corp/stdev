'use client'

import { Field, Input, NativeSelect, Stack, Textarea } from '@chakra-ui/react'
import type { Markdown } from '@prisma/client'
import { dateValue } from '@/utils/admin-format'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  markdown?: Markdown
  action: (formData: FormData) => Promise<void>
}

export function MarkdownFormDrawer({
  open,
  onOpenChange,
  markdown,
  action,
}: Props) {
  const editing = Boolean(markdown)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `마크다운 수정 #${markdown?.id}` : '마크다운 추가'}
      action={action}
      formKey={markdown?.id ?? 'create'}
    >
      {editing && <input type="hidden" name="id" value={markdown?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>유형</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="type"
              defaultValue={markdown?.type ?? 'articles'}
            >
              <option value="articles">정관</option>
              <option value="privacy">개인정보처리방침</option>
              <option value="terms">이용약관</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root required>
          <Field.Label>개정일</Field.Label>
          <Input
            name="revisionDate"
            type="date"
            defaultValue={markdown ? dateValue(markdown.revisionDate) : ''}
            required
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>시행일</Field.Label>
          <Input
            name="effectiveDate"
            type="date"
            defaultValue={markdown ? dateValue(markdown.effectiveDate) : ''}
            required
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>내용</Field.Label>
          <Textarea
            name="content"
            rows={10}
            defaultValue={markdown?.content ?? ''}
            required
          />
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

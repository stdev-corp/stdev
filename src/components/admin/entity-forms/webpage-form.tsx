'use client'

import { Field, Input, NativeSelect, Stack } from '@chakra-ui/react'
import type { Business, Webpage } from '@prisma/client'
import { dateValue } from '@/utils/admin-format'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  webpage?: Webpage
  businesses: Business[]
  action: (formData: FormData) => Promise<void>
}

export function WebpageFormDrawer({
  open,
  onOpenChange,
  webpage,
  businesses,
  action,
}: Props) {
  const editing = Boolean(webpage)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `웹페이지 수정 #${webpage?.id}` : '웹페이지 추가'}
      action={action}
    >
      {editing && <input type="hidden" name="id" value={webpage?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>유형</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="type"
              defaultValue={webpage?.type ?? 'blog_post'}
            >
              <option value="blog_post">블로그 포스트</option>
              <option value="news_article">신문 기사</option>
              <option value="press_release">보도 자료</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root required>
          <Field.Label>URL</Field.Label>
          <Input name="url" defaultValue={webpage?.url ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>제목</Field.Label>
          <Input name="title" defaultValue={webpage?.title ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>작성자</Field.Label>
          <Input name="author" defaultValue={webpage?.author ?? ''} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>게시일</Field.Label>
          <Input
            name="publishedDate"
            type="date"
            defaultValue={webpage ? dateValue(webpage.publishedDate) : ''}
            required
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>관련 사업</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="businessId"
              defaultValue={webpage?.businessId ?? ''}
            >
              <option value="">관련 사업 없음</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  #{business.id} {business.name}
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

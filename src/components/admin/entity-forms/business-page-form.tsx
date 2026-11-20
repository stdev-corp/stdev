'use client'

import { Field, Input, NativeSelect, Stack } from '@chakra-ui/react'
import type { BusinessPage, ImageAsset } from '@prisma/client'
import type { BusinessCategory } from '@/utils/cms-types'
import { FormDrawer } from '../form-drawer'
import {
  NotionContentField,
  type PreviewPageLinks,
} from '../notion-content-field'

export type BusinessOption = {
  id: number
  name: string
  slug: string | null
  category: BusinessCategory
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  page?: BusinessPage
  businesses: BusinessOption[]
  images: Pick<ImageAsset, 'id' | 'filename' | 'url'>[]
  action: (formData: FormData) => Promise<void>
  previewPageLinks?: PreviewPageLinks
}

export function BusinessPageFormDrawer({
  open,
  onOpenChange,
  page,
  businesses,
  images,
  action,
  previewPageLinks,
}: Props) {
  const editing = Boolean(page)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        editing ? `행사 하위 페이지 수정 #${page?.id}` : '행사 하위 페이지 추가'
      }
      action={action}
      formKey={page?.id ?? 'create'}
      size="xl"
    >
      {editing && <input type="hidden" name="id" value={page?.id} />}
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>행사</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="businessId"
              defaultValue={page?.businessId ?? ''}
            >
              <option value="">행사 선택</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  #{business.id} {business.name}
                  {business.slug ? ` (${business.slug})` : ' (슬러그 없음)'}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root required>
          <Field.Label>경로</Field.Label>
          <Input
            name="path"
            defaultValue={page?.path ?? ''}
            placeholder="예: faq, notice/team-building"
            required
          />
          <Field.HelperText>
            행사 주소 뒤에 붙습니다. 예) /hackathon/dsf26/faq
          </Field.HelperText>
        </Field.Root>
        <Field.Root required>
          <Field.Label>제목</Field.Label>
          <Input name="title" defaultValue={page?.title ?? ''} required />
        </Field.Root>
        <Field.Root>
          <Field.Label>아이콘</Field.Label>
          <Input
            name="icon"
            defaultValue={page?.icon ?? ''}
            placeholder="예: ❓"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>커버 이미지</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="coverImageId"
              defaultValue={page?.coverImageId ?? ''}
            >
              <option value="">커버 없음</option>
              {images.map((image) => (
                <option key={image.id} value={image.id}>
                  #{image.id} {image.filename ?? image.url}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <NotionContentField
          name="content"
          label="본문"
          defaultValue={page?.content ?? ''}
          resolvePageLinks={previewPageLinks}
          businessIdField="businessId"
        />
        <Field.Root>
          <Field.Label>노션 페이지 ID</Field.Label>
          <Input name="notionId" defaultValue={page?.notionId ?? ''} />
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

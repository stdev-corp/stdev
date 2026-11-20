'use client'

import {
  Field,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import type { ImageAsset, Institution } from '@prisma/client'
import type { BusinessCategory, BusinessRole } from '@/utils/cms-types'
import { CATEGORY_LABELS, fromEventInstant, ROLE_ORDER } from '@/utils/events'
import { FormDrawer } from '../form-drawer'
import { InstitutionRolePicker } from '../institution-role-picker'
import {
  NotionContentField,
  type PreviewPageLinks,
} from '../notion-content-field'

export type BusinessWithLinks = {
  id: number
  name: string
  code: string
  slug: string | null
  category: BusinessCategory
  startDate: Date
  endDate: Date
  hasTime: boolean
  location: string | null
  icon: string | null
  coverImageId: number | null
  summary: string | null
  content: string
  notionId: string | null
  institutions: {
    institutionId: number
    role: BusinessRole
    sortOrder: number
  }[]
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  business?: BusinessWithLinks
  institutions: Pick<Institution, 'id' | 'nameKo'>[]
  images: Pick<ImageAsset, 'id' | 'filename' | 'url'>[]
  action: (formData: FormData) => Promise<void>
  previewPageLinks?: PreviewPageLinks
}

function roleDefaults(business?: BusinessWithLinks) {
  return Object.fromEntries(
    ROLE_ORDER.map((role) => [
      role,
      (business?.institutions ?? [])
        .filter((link) => link.role === role)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((link) => link.institutionId),
    ]),
  ) as Record<BusinessRole, number[]>
}

export function BusinessFormDrawer({
  open,
  onOpenChange,
  business,
  institutions,
  images,
  action,
  previewPageLinks,
}: Props) {
  const editing = Boolean(business)
  const start = business
    ? fromEventInstant(business.startDate, business.hasTime)
    : null
  const end = business
    ? fromEventInstant(business.endDate, business.hasTime)
    : null

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `사업(행사) 수정 #${business?.id}` : '사업(행사) 추가'}
      action={action}
      formKey={business?.id ?? 'create'}
      size="xl"
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
          <Field.HelperText>
            내부에서 사업을 구분하는 고유 코드입니다.
          </Field.HelperText>
        </Field.Root>
        <Field.Root required>
          <Field.Label>분류</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="category"
              defaultValue={business?.category ?? 'hackathon'}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.HelperText>
            해커톤·아이디어톤은 &lsquo;해커톤&아이디어톤&rsquo;,
            컨퍼런스·프로그램은 &lsquo;컨퍼런스&프로그램&rsquo; 메뉴에 보입니다.
          </Field.HelperText>
        </Field.Root>
        <Field.Root>
          <Field.Label>URL 슬러그</Field.Label>
          <Input
            name="slug"
            defaultValue={business?.slug ?? ''}
            placeholder="예: dsf26"
          />
          <Field.HelperText>
            비우면 목록에만 보이고 행사 페이지는 만들지 않습니다. 영문
            소문자·숫자·하이픈.
          </Field.HelperText>
        </Field.Root>
        <Field.Root required>
          <Field.Label>시작일</Field.Label>
          <Input
            name="startDate"
            type="date"
            defaultValue={start?.date ?? ''}
            required
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>시작 시각</Field.Label>
          <Input
            name="startTime"
            type="time"
            defaultValue={start?.time ?? ''}
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>종료일</Field.Label>
          <Input
            name="endDate"
            type="date"
            defaultValue={end?.date ?? ''}
            required
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>종료 시각</Field.Label>
          <Input name="endTime" type="time" defaultValue={end?.time ?? ''} />
          <Field.HelperText>
            시각은 한국 시간입니다. 시작·종료 시각을 모두 비우면 날짜만
            표시합니다.
          </Field.HelperText>
        </Field.Root>
        <Field.Root>
          <Field.Label>장소</Field.Label>
          <Input name="location" defaultValue={business?.location ?? ''} />
        </Field.Root>
        <Stack gap={2}>
          <Text fontWeight="medium">주최·주관·후원·협력</Text>
          <Text fontSize="sm" color="gray.600">
            목록에 없는 기관은 &lsquo;기관&rsquo; 메뉴에서 먼저 추가하세요.
          </Text>
          <InstitutionRolePicker
            institutions={institutions}
            defaultValue={roleDefaults(business)}
          />
        </Stack>
        <Field.Root>
          <Field.Label>아이콘</Field.Label>
          <Input
            name="icon"
            defaultValue={business?.icon ?? ''}
            placeholder="예: 🌸"
          />
          <Field.HelperText>이모지 한 글자 또는 이미지 URL</Field.HelperText>
        </Field.Root>
        <Field.Root>
          <Field.Label>커버 이미지</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="coverImageId"
              defaultValue={business?.coverImageId ?? ''}
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
        <Field.Root>
          <Field.Label>목록 요약</Field.Label>
          <Textarea
            name="summary"
            rows={6}
            defaultValue={business?.summary ?? ''}
            fontFamily="mono"
            fontSize="sm"
          />
          <Field.HelperText>
            행사 목록에 보이는 요약입니다. 마크다운.
          </Field.HelperText>
        </Field.Root>
        <NotionContentField
          name="content"
          label="행사 페이지 본문"
          defaultValue={business?.content ?? ''}
          resolvePageLinks={previewPageLinks}
          businessIdField="id"
        />
        <Field.Root>
          <Field.Label>노션 페이지 ID</Field.Label>
          <Input name="notionId" defaultValue={business?.notionId ?? ''} />
          <Field.HelperText>
            옛 event.stdev.kr 주소(노션 ID)를 이 행사로 넘길 때 씁니다.
          </Field.HelperText>
        </Field.Root>
      </Stack>
    </FormDrawer>
  )
}

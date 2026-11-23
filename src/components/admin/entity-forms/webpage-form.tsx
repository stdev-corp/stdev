'use client'

import { Field, Input, NativeSelect, Stack } from '@chakra-ui/react'
import type { Business, FileAsset, Webpage } from '@prisma/client'
import { useState } from 'react'
import { dateValue } from '@/utils/admin-format'
import { FormDrawer } from '../form-drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  webpage?: Webpage
  businesses: Business[]
  files: FileAsset[]
  action: (formData: FormData) => Promise<void>
}

export function WebpageFormDrawer({
  open,
  onOpenChange,
  webpage,
  businesses,
  files,
  action,
}: Props) {
  const editing = Boolean(webpage)
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `웹페이지 수정 #${webpage?.id}` : '웹페이지 추가'}
      action={action}
      formKey={webpage?.id ?? 'create'}
    >
      {editing && <input type="hidden" name="id" value={webpage?.id} />}
      {/*
        EntityList는 수정 서랍을 늘 그려 두고 고른 레코드만 바꿔 넘긴다. 유형 상태를
        여기(서랍)에 두면 처음 값에 머물러, 다른 기사를 열고 저장할 때 유형이 바뀐다.
        그래서 상태는 레코드마다 다시 만드는 아래 컴포넌트가 갖는다.
      */}
      <WebpageFields
        key={webpage?.id ?? 'create'}
        webpage={webpage}
        businesses={businesses}
        files={files}
      />
    </FormDrawer>
  )
}

function WebpageFields({
  webpage,
  businesses,
  files,
}: Pick<Props, 'webpage' | 'businesses' | 'files'>) {
  // 뉴스 기사·블로그 포스트는 행사에 연결해야 공개 메뉴에 보인다. 서버도 막지만,
  // 저장 전에 브라우저가 먼저 알려 주도록 유형에 따라 필수로 바꾼다.
  const [type, setType] = useState(webpage?.type ?? 'blog_post')
  const needsBusiness = type !== 'press_release'
  return (
    <Stack gap={4}>
      <Field.Root required>
        <Field.Label>유형</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            name="type"
            value={type}
            onChange={(event) =>
              setType(event.currentTarget.value as Webpage['type'])
            }
          >
            <option value="blog_post">블로그 포스트</option>
            <option value="news_article">뉴스 기사</option>
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
      <Field.Root required={needsBusiness}>
        <Field.Label>관련 행사(사업)</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            name="businessId"
            defaultValue={webpage?.businessId ?? ''}
          >
            <option value="">관련 행사 없음(보도 자료만 가능)</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                #{business.id} {business.name}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Field.HelperText>
          뉴스 기사·블로그 포스트는 행사를 골라야 하며, 행사 분류에 따라
          해커톤&아이디어톤 또는 컨퍼런스&프로그램 메뉴에 보입니다.
        </Field.HelperText>
      </Field.Root>
      <Field.Root>
        <Field.Label>원문 저장본</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            name="archiveId"
            defaultValue={webpage?.archiveId ?? ''}
          >
            <option value="">저장본 없음</option>
            {files.map((file) => (
              <option key={file.id} value={file.id}>
                #{file.id} {file.filename}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Field.HelperText>
          원문 사이트가 사라질 때를 대비해 &apos;파일&apos;에 올려 둔 PDF 사본을
          고릅니다. 관리자 화면에만 보이며, 저장본으로 고른 파일은 연결을 풀기
          전에는 지울 수 없습니다.
        </Field.HelperText>
      </Field.Root>
    </Stack>
  )
}

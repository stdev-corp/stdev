'use client'

import { Text } from '@chakra-ui/react'
import type { Markdown } from '@prisma/client'
import { toDateString } from '@/utils/datetime'
import { EntityList } from '../entity-list'
import { MarkdownFormDrawer } from './markdown-form'

type Actions = {
  createMarkdown: (formData: FormData) => Promise<void>
  updateMarkdown: (formData: FormData) => Promise<void>
  deleteMarkdown: (formData: FormData) => Promise<void>
}

function markdownTypeLabel(type: Markdown['type']) {
  return type === 'articles'
    ? '정관'
    : type === 'privacy'
      ? '개인정보처리방침'
      : '이용약관'
}

export function MarkdownListClient({
  markdowns,
  actions,
}: {
  markdowns: Markdown[]
  actions: Actions
}) {
  return (
    <EntityList
      title="마크다운"
      description="정관, 개인정보처리방침, 이용약관 문서를 관리합니다."
      items={markdowns}
      deleteAction={actions.deleteMarkdown}
      deleteLabel="마크다운"
      renderItem={(markdown) => (
        <>
          <Text fontWeight="semibold">
            #{markdown.id} · {markdownTypeLabel(markdown.type)}
          </Text>
          <Text fontSize="sm" color="gray.600">
            시행 {toDateString(markdown.effectiveDate)} · 개정{' '}
            {toDateString(markdown.revisionDate)}
          </Text>
        </>
      )}
      renderCreate={(open, setOpen) => (
        <MarkdownFormDrawer
          open={open}
          onOpenChange={setOpen}
          action={actions.createMarkdown}
        />
      )}
      renderEdit={(markdown, open, closeEdit) => (
        <MarkdownFormDrawer
          open={open}
          onOpenChange={(next) => {
            if (!next) closeEdit()
          }}
          markdown={markdown ?? undefined}
          action={actions.updateMarkdown}
        />
      )}
    />
  )
}

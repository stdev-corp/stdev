'use client'

import { Text } from '@chakra-ui/react'
import type { Business, Webpage } from '@prisma/client'
import { toDateString } from '@/utils/datetime'
import { EntityList } from '../entity-list'
import { WebpageFormDrawer } from './webpage-form'

type Actions = {
  createWebpage: (formData: FormData) => Promise<void>
  updateWebpage: (formData: FormData) => Promise<void>
  deleteWebpage: (formData: FormData) => Promise<void>
}

function webpageTypeLabel(type: Webpage['type']) {
  return type === 'blog_post'
    ? '블로그 포스트'
    : type === 'news_article'
      ? '신문 기사'
      : '보도 자료'
}

export function WebpageListClient({
  webpages,
  businesses,
  actions,
}: {
  webpages: Webpage[]
  businesses: Business[]
  actions: Actions
}) {
  return (
    <EntityList
      title="웹페이지"
      description="블로그, 기사, 보도자료 링크를 관리합니다."
      items={webpages}
      deleteAction={actions.deleteWebpage}
      deleteLabel="웹페이지"
      renderItem={(webpage) => (
        <>
          <Text fontWeight="semibold">
            #{webpage.id} · {webpage.title}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {webpageTypeLabel(webpage.type)} ·{' '}
            {toDateString(webpage.publishedDate)} · {webpage.author}
          </Text>
        </>
      )}
      renderCreate={(open, setOpen) => (
        <WebpageFormDrawer
          open={open}
          onOpenChange={setOpen}
          businesses={businesses}
          action={actions.createWebpage}
        />
      )}
      renderEdit={(webpage, open, closeEdit) => (
        <WebpageFormDrawer
          open={open}
          onOpenChange={(next) => {
            if (!next) closeEdit()
          }}
          webpage={webpage ?? undefined}
          businesses={businesses}
          action={actions.updateWebpage}
        />
      )}
    />
  )
}

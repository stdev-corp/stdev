'use client'

import { Link, Text } from '@chakra-ui/react'
import type { Business, FileAsset, Webpage } from '@prisma/client'
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
      ? '뉴스 기사'
      : '보도 자료'
}

export type WebpageWithArchive = Webpage & { archive: FileAsset | null }

export function WebpageListClient({
  webpages,
  businesses,
  files,
  actions,
}: {
  webpages: WebpageWithArchive[]
  businesses: Business[]
  files: FileAsset[]
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
          <Text fontSize="sm" color="gray.600">
            원문 저장본:{' '}
            {webpage.archive?.url ? (
              <Link
                href={webpage.archive.url}
                target="_blank"
                rel="noopener noreferrer"
                color="teal.600"
              >
                {webpage.archive.filename}
              </Link>
            ) : (
              '없음'
            )}
          </Text>
        </>
      )}
      renderCreate={(open, setOpen) => (
        <WebpageFormDrawer
          open={open}
          onOpenChange={setOpen}
          businesses={businesses}
          files={files}
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
          files={files}
          action={actions.updateWebpage}
        />
      )}
    />
  )
}

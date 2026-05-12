'use client'

import { Text } from '@chakra-ui/react'
import type { History, ImageAsset } from '@prisma/client'
import { toDateString } from '@/utils/datetime'
import { EntityList } from '../entity-list'
import { HistoryFormDrawer } from './history-form'

type Actions = {
  createHistory: (formData: FormData) => Promise<void>
  updateHistory: (formData: FormData) => Promise<void>
  deleteHistory: (formData: FormData) => Promise<void>
}

export function HistoryListClient({
  histories,
  images,
  actions,
}: {
  histories: History[]
  images: ImageAsset[]
  actions: Actions
}) {
  return (
    <EntityList
      title="연혁"
      description="단체 주요 연혁과 관련 이미지를 관리합니다."
      items={histories}
      deleteAction={actions.deleteHistory}
      deleteLabel="연혁"
      renderItem={(history) => (
        <>
          <Text fontWeight="semibold">
            #{history.id} · {history.title}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {toDateString(history.date)}
          </Text>
        </>
      )}
      renderCreate={(close) => (
        <HistoryFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          images={images}
          action={actions.createHistory}
        />
      )}
      renderEdit={(history, close) => (
        <HistoryFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          history={history}
          images={images}
          action={actions.updateHistory}
        />
      )}
    />
  )
}

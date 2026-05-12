'use client'

import { Text } from '@chakra-ui/react'
import type { ImageAsset } from '@prisma/client'
import { EntityList } from '../entity-list'
import { ImageFormDrawer } from './image-form'

type Actions = {
  createImageAsset: (formData: FormData) => Promise<void>
  updateImageAsset: (formData: FormData) => Promise<void>
  deleteImageAsset: (formData: FormData) => Promise<void>
}

export function ImageListClient({
  images,
  actions,
}: {
  images: ImageAsset[]
  actions: Actions
}) {
  return (
    <EntityList
      title="이미지"
      description="CMS에서 사용하는 이미지 URL과 메타데이터를 관리합니다."
      items={images}
      deleteAction={actions.deleteImageAsset}
      deleteLabel="이미지"
      renderItem={(image) => (
        <>
          <Text fontWeight="semibold">
            #{image.id} · {image.filename ?? '(no filename)'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {image.alt ?? 'alt 없음'} · {image.url ? '연결됨' : 'URL 없음'}
          </Text>
          <Text fontSize="sm" color="gray.600" truncate>
            {image.url ?? 'URL 없음'}
          </Text>
        </>
      )}
      renderCreate={(close) => (
        <ImageFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          action={actions.createImageAsset}
        />
      )}
      renderEdit={(image, close) => (
        <ImageFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          image={image}
          action={actions.updateImageAsset}
        />
      )}
    />
  )
}

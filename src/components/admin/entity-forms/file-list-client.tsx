'use client'

import { Text } from '@chakra-ui/react'
import type { FileAsset } from '@prisma/client'
import { EntityList } from '../entity-list'
import { FileFormDrawer } from './file-form'

type Actions = {
  createFileAsset: (formData: FormData) => Promise<void>
  updateFileAsset: (formData: FormData) => Promise<void>
  deleteFileAsset: (formData: FormData) => Promise<void>
}

export function FileListClient({
  files,
  actions,
}: {
  files: FileAsset[]
  actions: Actions
}) {
  return (
    <EntityList
      title="파일"
      description="CMS에서 사용하는 PDF 파일 URL과 메타데이터를 관리합니다."
      items={files}
      deleteAction={actions.deleteFileAsset}
      deleteLabel="파일"
      renderItem={(file) => (
        <>
          <Text fontWeight="semibold">
            #{file.id} · {file.filename}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {file.mimeType ?? 'mime 없음'} · {file.url ?? 'URL 없음'}
          </Text>
        </>
      )}
      renderCreate={(close) => (
        <FileFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          action={actions.createFileAsset}
        />
      )}
      renderEdit={(file, close) => (
        <FileFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          file={file}
          action={actions.updateFileAsset}
        />
      )}
    />
  )
}

import { prisma } from '@/utils/prisma'
import { FileListClient } from '@/components/admin/entity-forms/file-list-client'
import {
  createFileAsset,
  deleteFileAsset,
  updateFileAsset,
} from '@/app/(cms)/admin/actions'

export default async function FilesPage() {
  const files = await prisma.fileAsset.findMany({
    orderBy: { id: 'asc' },
  })
  return (
    <FileListClient
      files={files}
      actions={{ createFileAsset, updateFileAsset, deleteFileAsset }}
    />
  )
}

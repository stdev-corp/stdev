import { prisma } from '@/utils/prisma'
import { ImageListClient } from '@/components/admin/entity-forms/image-list-client'
import {
  createImageAsset,
  deleteImageAsset,
  updateImageAsset,
} from '@/app/(cms)/admin/actions'

export default async function ImagesPage() {
  const images = await prisma.imageAsset.findMany({
    orderBy: { id: 'asc' },
  })
  return (
    <ImageListClient
      images={images}
      actions={{ createImageAsset, updateImageAsset, deleteImageAsset }}
    />
  )
}

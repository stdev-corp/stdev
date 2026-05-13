import { prisma } from '@/utils/prisma'
import { HistoryListClient } from '@/components/admin/entity-forms/history-list-client'
import {
  createHistory,
  deleteHistory,
  updateHistory,
} from '@/app/(cms)/admin/actions'

export default async function HistoriesPage() {
  const [histories, images] = await Promise.all([
    prisma.history.findMany({
      orderBy: { date: 'desc' },
    }),
    prisma.imageAsset.findMany({
      orderBy: { id: 'asc' },
    }),
  ])
  return (
    <HistoryListClient
      histories={histories}
      images={images}
      actions={{ createHistory, updateHistory, deleteHistory }}
    />
  )
}

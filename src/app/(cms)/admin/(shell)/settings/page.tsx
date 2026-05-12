import { prisma } from '@/utils/prisma'
import { SettingListClient } from '@/components/admin/entity-forms/setting-list-client'
import {
  createAdminSetting,
  deleteAdminSetting,
  updateAdminSetting,
} from '@/app/(cms)/admin/actions'

export default async function AdminSettingsPage() {
  const rows = await prisma.adminSettings.findMany({
    orderBy: { key: 'asc' },
    select: {
      id: true,
      key: true,
      createdAt: true,
      updatedAt: true,
      value: true,
    },
  })

  const summaries = rows.map((row) => ({
    id: row.id,
    key: row.key,
    hasValue: row.value.length > 0,
    valueLength: row.value.length,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))

  return (
    <SettingListClient
      settings={summaries}
      actions={{ createAdminSetting, updateAdminSetting, deleteAdminSetting }}
    />
  )
}

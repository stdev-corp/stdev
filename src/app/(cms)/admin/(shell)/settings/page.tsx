import { prisma } from '@/utils/prisma'
import { SettingListClient } from '@/components/admin/entity-forms/setting-list-client'
import {
  createAdminSetting,
  deleteAdminSetting,
  updateAdminSetting,
} from '@/app/(cms)/admin/actions'

export default async function AdminSettingsPage() {
  const settings = await prisma.adminSettings.findMany({
    orderBy: { key: 'asc' },
  })
  return (
    <SettingListClient
      settings={settings}
      actions={{ createAdminSetting, updateAdminSetting, deleteAdminSetting }}
    />
  )
}

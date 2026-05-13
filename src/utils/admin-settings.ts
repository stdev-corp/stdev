import { prisma } from '@/utils/prisma'

export const ADMIN_SETTINGS_KEYS = {
  awsAccessKeyId: 'AWS_ACCESS_KEY_ID',
  awsSecretAccessKey: 'AWS_SECRET_ACCESS_KEY',
} as const

export type AdminSettingsKey =
  (typeof ADMIN_SETTINGS_KEYS)[keyof typeof ADMIN_SETTINGS_KEYS]

export async function getAdminSetting(key: string) {
  const setting = await prisma.adminSettings.findUnique({ where: { key } })
  return setting?.value ?? null
}

export async function listAdminSettings() {
  return prisma.adminSettings.findMany({ orderBy: { key: 'asc' } })
}

export async function upsertAdminSetting(key: string, value: string) {
  const trimmedKey = key.trim()
  const trimmedValue = value.trim()

  if (!trimmedKey) {
    throw new Error('설정 키는 비어 있을 수 없습니다.')
  }

  return prisma.adminSettings.upsert({
    where: { key: trimmedKey },
    create: { key: trimmedKey, value: trimmedValue },
    update: { value: trimmedValue },
  })
}

export async function deleteAdminSettingByKey(key: string) {
  await prisma.adminSettings.delete({ where: { key } })
}

export async function getAwsCredentials() {
  const [accessKeyId, secretAccessKey] = await Promise.all([
    getAdminSetting(ADMIN_SETTINGS_KEYS.awsAccessKeyId),
    getAdminSetting(ADMIN_SETTINGS_KEYS.awsSecretAccessKey),
  ])

  if (!accessKeyId || !secretAccessKey) {
    return null
  }

  return { accessKeyId, secretAccessKey }
}

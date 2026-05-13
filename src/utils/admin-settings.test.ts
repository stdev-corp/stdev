import { beforeEach, describe, expect, it } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/tests/mocks/prisma'
import {
  ADMIN_SETTINGS_KEYS,
  deleteAdminSettingByKey,
  getAdminSetting,
  getAwsCredentials,
  listAdminSettings,
  upsertAdminSetting,
} from '@/utils/admin-settings'

beforeEach(() => {
  resetPrismaMock()
})

describe('ADMIN_SETTINGS_KEYS', () => {
  it('exposes AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY constants', () => {
    expect(ADMIN_SETTINGS_KEYS.awsAccessKeyId).toBe('AWS_ACCESS_KEY_ID')
    expect(ADMIN_SETTINGS_KEYS.awsSecretAccessKey).toBe('AWS_SECRET_ACCESS_KEY')
  })
})

describe('getAdminSetting', () => {
  it('returns the value when present', async () => {
    prismaMock.adminSettings.findUnique.mockResolvedValue({
      id: 1,
      key: 'AWS_ACCESS_KEY_ID',
      value: 'AKIA123',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    const value = await getAdminSetting('AWS_ACCESS_KEY_ID')
    expect(value).toBe('AKIA123')
    expect(prismaMock.adminSettings.findUnique).toHaveBeenCalledWith({
      where: { key: 'AWS_ACCESS_KEY_ID' },
    })
  })

  it('returns null when not present', async () => {
    prismaMock.adminSettings.findUnique.mockResolvedValue(null)
    const value = await getAdminSetting('MISSING')
    expect(value).toBeNull()
  })
})

describe('listAdminSettings', () => {
  it('queries with key asc order', async () => {
    prismaMock.adminSettings.findMany.mockResolvedValue([])
    await listAdminSettings()
    expect(prismaMock.adminSettings.findMany).toHaveBeenCalledWith({
      orderBy: { key: 'asc' },
    })
  })
})

describe('upsertAdminSetting', () => {
  it('trims key and value before upserting', async () => {
    prismaMock.adminSettings.upsert.mockResolvedValue({
      id: 1,
      key: 'FOO',
      value: 'bar',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    await upsertAdminSetting('  FOO  ', '  bar  ')
    expect(prismaMock.adminSettings.upsert).toHaveBeenCalledWith({
      where: { key: 'FOO' },
      create: { key: 'FOO', value: 'bar' },
      update: { value: 'bar' },
    })
  })

  it('throws when key is empty after trim', async () => {
    await expect(upsertAdminSetting('   ', 'value')).rejects.toThrow(
      '설정 키는 비어 있을 수 없습니다.',
    )
    expect(prismaMock.adminSettings.upsert).not.toHaveBeenCalled()
  })
})

describe('deleteAdminSettingByKey', () => {
  it('calls prisma delete with key', async () => {
    prismaMock.adminSettings.delete.mockResolvedValue({
      id: 1,
      key: 'FOO',
      value: 'bar',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    await deleteAdminSettingByKey('FOO')
    expect(prismaMock.adminSettings.delete).toHaveBeenCalledWith({
      where: { key: 'FOO' },
    })
  })
})

describe('getAwsCredentials', () => {
  it('returns credentials when both AWS keys exist', async () => {
    prismaMock.adminSettings.findUnique
      .mockResolvedValueOnce({
        id: 1,
        key: 'AWS_ACCESS_KEY_ID',
        value: 'AKIA',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)
      .mockResolvedValueOnce({
        id: 2,
        key: 'AWS_SECRET_ACCESS_KEY',
        value: 'secret',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

    const creds = await getAwsCredentials()
    expect(creds).toEqual({ accessKeyId: 'AKIA', secretAccessKey: 'secret' })
  })

  it('returns null when access key is missing', async () => {
    prismaMock.adminSettings.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 2,
        key: 'AWS_SECRET_ACCESS_KEY',
        value: 'secret',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

    const creds = await getAwsCredentials()
    expect(creds).toBeNull()
  })

  it('returns null when secret key is missing', async () => {
    prismaMock.adminSettings.findUnique
      .mockResolvedValueOnce({
        id: 1,
        key: 'AWS_ACCESS_KEY_ID',
        value: 'AKIA',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)
      .mockResolvedValueOnce(null)

    const creds = await getAwsCredentials()
    expect(creds).toBeNull()
  })
})

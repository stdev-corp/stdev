'use client'

import { Code, Text } from '@chakra-ui/react'
import type { AdminSettings } from '@prisma/client'
import { EntityList } from '../entity-list'
import { SettingFormDrawer } from './setting-form'

type Actions = {
  createAdminSetting: (formData: FormData) => Promise<void>
  updateAdminSetting: (formData: FormData) => Promise<void>
  deleteAdminSetting: (formData: FormData) => Promise<void>
}

function maskedPreview(value: string) {
  if (value.length === 0) {
    return '(빈 값)'
  }
  return '•'.repeat(Math.min(value.length, 12))
}

export function SettingListClient({
  settings,
  actions,
}: {
  settings: AdminSettings[]
  actions: Actions
}) {
  return (
    <EntityList
      title="설정"
      description="키-값 형태로 외부 서비스 자격 증명을 저장합니다. AWS Organizations 연결에는 AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY 키를 사용합니다."
      items={settings}
      deleteAction={actions.deleteAdminSetting}
      deleteLabel="설정"
      renderItem={(setting) => (
        <>
          <Text fontWeight="semibold">
            <Code>{setting.key}</Code>
          </Text>
          <Text fontSize="sm" color="gray.600">
            값: {maskedPreview(setting.value)}
          </Text>
        </>
      )}
      renderCreate={(close) => (
        <SettingFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          action={actions.createAdminSetting}
        />
      )}
      renderEdit={(setting, close) => (
        <SettingFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          setting={setting}
          action={actions.updateAdminSetting}
        />
      )}
    />
  )
}

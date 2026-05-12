'use client'

import { Code, Text } from '@chakra-ui/react'
import { EntityList } from '../entity-list'
import { SettingFormDrawer, type AdminSettingSummary } from './setting-form'

type Actions = {
  createAdminSetting: (formData: FormData) => Promise<void>
  updateAdminSetting: (formData: FormData) => Promise<void>
  deleteAdminSetting: (formData: FormData) => Promise<void>
}

function maskedPreview(setting: AdminSettingSummary) {
  if (!setting.hasValue) {
    return '(빈 값)'
  }
  return '•'.repeat(Math.min(setting.valueLength, 12))
}

export function SettingListClient({
  settings,
  actions,
}: {
  settings: AdminSettingSummary[]
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
            값: {maskedPreview(setting)}
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

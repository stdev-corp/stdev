'use client'

import { Text } from '@chakra-ui/react'
import type { ImageAsset, Institution } from '@prisma/client'
import { EntityList } from '../entity-list'
import { InstitutionFormDrawer } from './institution-form'

type Actions = {
  createInstitution: (formData: FormData) => Promise<void>
  updateInstitution: (formData: FormData) => Promise<void>
  deleteInstitution: (formData: FormData) => Promise<void>
}

export function InstitutionListClient({
  institutions,
  images,
  actions,
}: {
  institutions: Institution[]
  images: ImageAsset[]
  actions: Actions
}) {
  return (
    <EntityList
      title="기관"
      description="협력 기관의 이름, 링크, 로고 이미지를 관리합니다."
      items={institutions}
      deleteAction={actions.deleteInstitution}
      deleteLabel="기관"
      renderItem={(institution) => (
        <>
          <Text fontWeight="semibold">
            #{institution.id} · {institution.nameKo}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {institution.nameEn} · {institution.url}
          </Text>
        </>
      )}
      renderCreate={(close) => (
        <InstitutionFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          images={images}
          action={actions.createInstitution}
        />
      )}
      renderEdit={(institution, close) => (
        <InstitutionFormDrawer
          open
          onOpenChange={(next) => {
            if (!next) close()
          }}
          institution={institution}
          images={images}
          action={actions.updateInstitution}
        />
      )}
    />
  )
}

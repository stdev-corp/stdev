'use client'

import { Text } from '@chakra-ui/react'
import type { Business } from '@prisma/client'
import { toDateString } from '@/utils/datetime'
import { EntityList } from '../entity-list'
import { BusinessFormDrawer } from './business-form'

type Actions = {
  createBusiness: (formData: FormData) => Promise<void>
  updateBusiness: (formData: FormData) => Promise<void>
  deleteBusiness: (formData: FormData) => Promise<void>
}

export function BusinessListClient({
  businesses,
  actions,
}: {
  businesses: Business[]
  actions: Actions
}) {
  return (
    <EntityList
      title="사업"
      description="사업 코드, 기간, 장소 등을 관리합니다."
      items={businesses}
      deleteAction={actions.deleteBusiness}
      deleteLabel="사업"
      renderItem={(business) => (
        <>
          <Text fontWeight="semibold">
            #{business.id} · {business.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            코드 {business.code} · {toDateString(business.startDate)} ~{' '}
            {toDateString(business.endDate)}
            {business.location ? ` · ${business.location}` : ''}
          </Text>
        </>
      )}
      renderCreate={(open, setOpen) => (
        <BusinessFormDrawer
          open={open}
          onOpenChange={setOpen}
          action={actions.createBusiness}
        />
      )}
      renderEdit={(business, open, closeEdit) => (
        <BusinessFormDrawer
          open={open}
          onOpenChange={(next) => {
            if (!next) closeEdit()
          }}
          business={business ?? undefined}
          action={actions.updateBusiness}
        />
      )}
    />
  )
}

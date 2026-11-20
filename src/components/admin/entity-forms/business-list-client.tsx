'use client'

import { Text } from '@chakra-ui/react'
import type { ImageAsset, Institution } from '@prisma/client'
import { toDateString } from '@/utils/datetime'
import { CATEGORY_LABELS, eventHref } from '@/utils/events'
import { EntityList } from '../entity-list'
import type { PreviewPageLinks } from '../notion-content-field'
import { BusinessFormDrawer, type BusinessWithLinks } from './business-form'

type Actions = {
  createBusiness: (formData: FormData) => Promise<void>
  updateBusiness: (formData: FormData) => Promise<void>
  deleteBusiness: (formData: FormData) => Promise<void>
  previewPageLinks?: PreviewPageLinks
}

export function BusinessListClient({
  businesses,
  institutions,
  images,
  actions,
}: {
  businesses: BusinessWithLinks[]
  institutions: Pick<Institution, 'id' | 'nameKo'>[]
  images: Pick<ImageAsset, 'id' | 'filename' | 'url'>[]
  actions: Actions
}) {
  return (
    <EntityList
      title="사업(행사)"
      description="행사의 분류, 일시, 장소, 주최·주관·후원 기관과 행사 페이지 본문을 관리합니다. 개최일 최신순입니다."
      items={businesses}
      deleteAction={actions.deleteBusiness}
      deleteLabel="사업"
      renderItem={(business) => (
        <>
          <Text fontWeight="semibold">
            #{business.id} · {business.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {CATEGORY_LABELS[business.category]} · 코드 {business.code} ·{' '}
            {toDateString(business.startDate)} ~{' '}
            {toDateString(business.endDate)}
            {business.location ? ` · ${business.location}` : ''}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {business.slug
              ? `페이지 ${eventHref(business.category, business.slug)}`
              : '행사 페이지 없음(목록에만 표시)'}
          </Text>
        </>
      )}
      renderCreate={(open, setOpen) => (
        <BusinessFormDrawer
          open={open}
          onOpenChange={setOpen}
          institutions={institutions}
          images={images}
          action={actions.createBusiness}
          previewPageLinks={actions.previewPageLinks}
        />
      )}
      renderEdit={(business, open, closeEdit) => (
        <BusinessFormDrawer
          open={open}
          onOpenChange={(next) => {
            if (!next) closeEdit()
          }}
          business={business ?? undefined}
          institutions={institutions}
          images={images}
          action={actions.updateBusiness}
          previewPageLinks={actions.previewPageLinks}
        />
      )}
    />
  )
}

'use client'

import { Text } from '@chakra-ui/react'
import type { BusinessPage, ImageAsset } from '@prisma/client'
import { eventPageHref } from '@/utils/events'
import { EntityList } from '../entity-list'
import type { PreviewPageLinks } from '../notion-content-field'
import {
  BusinessPageFormDrawer,
  type BusinessOption,
} from './business-page-form'

type Actions = {
  createBusinessPage: (formData: FormData) => Promise<void>
  updateBusinessPage: (formData: FormData) => Promise<void>
  deleteBusinessPage: (formData: FormData) => Promise<void>
  previewPageLinks?: PreviewPageLinks
}

export function BusinessPageListClient({
  pages,
  businesses,
  images,
  actions,
}: {
  pages: BusinessPage[]
  businesses: BusinessOption[]
  images: Pick<ImageAsset, 'id' | 'filename' | 'url'>[]
  actions: Actions
}) {
  return (
    <EntityList
      title="행사 하위 페이지"
      description="행사 아래의 FAQ, 지원 안내, 동의서, 참가자 안내 같은 페이지를 관리합니다."
      items={pages}
      deleteAction={actions.deleteBusinessPage}
      deleteLabel="행사 페이지"
      renderItem={(page) => {
        const business = businesses.find(
          (candidate) => candidate.id === page.businessId,
        )
        return (
          <>
            <Text fontWeight="semibold">
              #{page.id} · {page.icon ? `${page.icon} ` : ''}
              {page.title}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {business?.name ?? `사업 #${page.businessId}`} ·{' '}
              {business?.slug
                ? `페이지 ${eventPageHref(business.category, business.slug, page.path)}`
                : `행사 슬러그가 없어 공개되지 않음(${page.path})`}
            </Text>
          </>
        )
      }}
      renderCreate={(open, setOpen) => (
        <BusinessPageFormDrawer
          open={open}
          onOpenChange={setOpen}
          businesses={businesses}
          images={images}
          action={actions.createBusinessPage}
          previewPageLinks={actions.previewPageLinks}
        />
      )}
      renderEdit={(page, open, closeEdit) => (
        <BusinessPageFormDrawer
          open={open}
          onOpenChange={(next) => {
            if (!next) closeEdit()
          }}
          page={page ?? undefined}
          businesses={businesses}
          images={images}
          action={actions.updateBusinessPage}
          previewPageLinks={actions.previewPageLinks}
        />
      )}
    />
  )
}

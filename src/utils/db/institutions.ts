import type { CollectionConfig } from 'payload'

export const Institutions: CollectionConfig = {
  slug: 'institutions',
  fields: [
    {
      name: 'name_ko',
      label: '기관명 (한국어)',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'name_en',
      label: '기관명 (영어)',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'url',
      label: '기관 홈페이지 URL',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'logo',
      label: '기관 로고',
      type: 'upload',
      relationTo: 'images',
      required: true,
      unique: true,
    },
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

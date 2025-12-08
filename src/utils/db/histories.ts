import { CollectionConfig } from 'payload'

export const Histories: CollectionConfig = {
  slug: 'histories',
  fields: [
    {
      name: 'date',
      label: '날짜',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy. M. d.',
        },
      },
    },
    {
      name: 'title',
      label: '제목',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      label: '내용',
      type: 'textarea',
    },
    {
      name: 'image',
      label: '이미지',
      type: 'upload',
      relationTo: 'images',
    },
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

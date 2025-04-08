import type { CollectionConfig } from 'payload'

export const Reports: CollectionConfig = {
  slug: 'reports',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: '총회 및 이사회',
          value: 'meeting',
        },
      ],
      required: true,
    },
    {
      name: 'file',
      label: 'PDF 파일',
      type: 'upload',
      relationTo: 'files',
      required: true,
      unique: true,
    },
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

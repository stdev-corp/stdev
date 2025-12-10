import type { CollectionConfig } from 'payload'

export const Markdowns: CollectionConfig = {
  slug: 'markdowns',
  fields: [
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: '정관',
          value: 'articles',
        },
        {
          label: '개인정보처리방침',
          value: 'privacy',
        },
        {
          label: '이용약관',
          value: 'terms',
        },
      ],
      required: true,
    },
    {
      name: 'revisionDate',
      label: '제정/개정일',
      type: 'date',
      required: true,
    },
    {
      name: 'effectiveDate',
      label: '시행일',
      type: 'date',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

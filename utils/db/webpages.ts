import type { CollectionConfig } from 'payload'

export const Webpages: CollectionConfig = {
  slug: 'webpages',
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
    },
    {
      name: 'business',
      type: 'relationship',
      relationTo: 'businesses',
      hasMany: false,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: '블로그 포스트',
          value: 'blog_post',
        },
        {
          label: '신문 기사',
          value: 'news_article',
        },
        {
          label: '보도 자료',
          value: 'press_release',
        },
      ],
      required: true,
    },
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

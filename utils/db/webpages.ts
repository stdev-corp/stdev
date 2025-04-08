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
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

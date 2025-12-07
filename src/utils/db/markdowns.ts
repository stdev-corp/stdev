import type { CollectionConfig } from 'payload'

export const Markdowns: CollectionConfig = {
  slug: 'markdowns',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'subtitle',
      type: 'text',
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

import type { CollectionConfig } from 'payload'

export const Images: CollectionConfig = {
  slug: 'images',
  upload: {
    staticDir: 'images',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

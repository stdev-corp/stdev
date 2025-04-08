import type { CollectionConfig } from 'payload'

export const Files: CollectionConfig = {
  slug: 'files',
  upload: {
    staticDir: 'files',
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      name: 'filename',
      type: 'text',
      required: true,
      label: 'File Name',
    },
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

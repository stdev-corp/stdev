import type { CollectionConfig } from 'payload'

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
    },
  ],
  access: {
    read: () => true,
  },
  timestamps: true,
}

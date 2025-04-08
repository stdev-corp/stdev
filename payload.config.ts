import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import { Businesses } from '@/utils/db/businesses'
import { Files } from '@/utils/db/files'
import { Images } from '@/utils/db/images'
import { Webpages } from '@/utils/db/webpages'
import { Institutions } from '@/utils/db/institutions'
import { Reports } from '@/utils/db/reports'
import { Markdowns } from './utils/db/markdowns'

export default buildConfig({
  editor: lexicalEditor(),
  collections: [
    Businesses,
    Files,
    Images,
    Institutions,
    Markdowns,
    Reports,
    Webpages,
  ],
  plugins: [
    s3Storage({
      collections: {
        files: {
          prefix: 'files',
        },
        images: {
          prefix: 'images',
        },
      },
      bucket: 'stdev-kr',
      config: {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY || '',
          secretAccessKey: process.env.AWS_SECRET_KEY || '',
        },
        region: 'ap-northeast-2',
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
      ssl: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    },
  }),
  sharp,
})

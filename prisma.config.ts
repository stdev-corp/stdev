import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'
import { withDatabaseSslParams } from './src/utils/database-url'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: withDatabaseSslParams(env('DATABASE_URL')),
  },
})

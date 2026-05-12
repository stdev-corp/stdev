import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { withDatabaseSslParams } from './src/utils/database-url'

// `prisma generate` loads this config eagerly but does not need a live DB.
// Fall back to a placeholder so build steps without DATABASE_URL (CI/CD)
// still succeed; runtime commands (migrate/studio) will surface a real
// connection error if they end up using the placeholder.
const databaseUrl =
  process.env.DATABASE_URL || 'postgres://user:password@host:5432/placeholder'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: withDatabaseSslParams(databaseUrl),
  },
})

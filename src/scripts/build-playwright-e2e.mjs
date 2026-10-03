import { config } from 'dotenv'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// `next build` loads .env.production.local, .env.local, .env.production and
// .env (.env.test only under NODE_ENV=test), and src/utils/prisma.ts needs
// DATABASE_URL while it collects page data. Load .env.test into the
// environment first, as playwright.config.ts and the prepare script do, so the
// E2E build sees the same values locally as in CI. dotenv leaves variables the
// shell already set alone, and Next does not override the environment with
// .env files, so a developer's .env/.env.local cannot replace the test values
// (keys absent from .env.test still come from those files). The path is
// anchored to this file, and a missing .env.test fails here instead of quietly
// building against those files.
const envTest = fileURLToPath(new URL('../../.env.test', import.meta.url))
const { error } = config({ path: envTest })

if (error) {
  throw error
}

const result = spawnSync('pnpm', ['build'], { stdio: 'inherit' })

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)

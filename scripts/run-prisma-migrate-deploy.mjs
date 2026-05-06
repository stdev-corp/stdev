import 'dotenv/config'
import { spawn } from 'node:child_process'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const rejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' ? 'accept_invalid_certs' : null

const url = new URL(databaseUrl)

if (rejectUnauthorized) {
  url.searchParams.set('sslmode', 'require')
  url.searchParams.set('sslaccept', rejectUnauthorized)
}

const child = spawn('pnpm', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: url.toString(),
  },
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

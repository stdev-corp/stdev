import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { existsSync, copyFileSync } from 'node:fs'

const composeArgs = ['compose', '-f', 'docker-compose.test.yml']

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`)
  }
}

function waitForPostgres() {
  const maxAttempts = 30

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnSync(
      'docker',
      [
        ...composeArgs,
        'exec',
        '-T',
        'postgres',
        'pg_isready',
        '-U',
        'stdev',
        '-d',
        'stdev_test',
      ],
      { stdio: 'ignore' },
    )

    if (result.status === 0) {
      return
    }

    spawnSync('node', ['-e', 'setTimeout(() => {}, 1000)'])
  }

  throw new Error('Timed out waiting for Playwright test Postgres')
}

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env')
}

run('docker', [...composeArgs, 'up', '-d', 'postgres'])
waitForPostgres()
run('pnpm', ['db:migrate:deploy'])
run('pnpm', ['exec', 'tsx', 'scripts/seed-playwright-e2e.ts'])

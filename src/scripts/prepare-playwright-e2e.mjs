import { config } from 'dotenv'
import { spawnSync } from 'node:child_process'

config({ path: '.env.test' })

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

run('docker', [...composeArgs, 'up', '-d', '--wait', 'postgres', 'minio'])
run('pnpm', ['db:migrate:deploy'])
run('pnpm', ['exec', 'tsx', 'src/scripts/seed-playwright-e2e.ts'])

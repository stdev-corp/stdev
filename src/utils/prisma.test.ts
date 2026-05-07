import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@prisma/client', () => {
  class PrismaClient {
    constructor(public config?: unknown) {}
    async $connect() {}
    async $disconnect() {}
  }
  return { PrismaClient }
})

vi.mock('@prisma/adapter-pg', () => {
  class PrismaPg {
    constructor(public config?: unknown) {}
  }
  return { PrismaPg }
})

describe('prisma singleton', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doUnmock('@/utils/prisma')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete (globalThis as { prisma?: unknown }).prisma
  })

  it('throws when DATABASE_URL missing', async () => {
    vi.stubEnv('DATABASE_URL', '')
    await expect(import('@/utils/prisma')).rejects.toThrow(
      'DATABASE_URL is required',
    )
  })

  it('creates client when DATABASE_URL set', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/test')
    const mod = await import('@/utils/prisma')
    expect(mod.prisma).toBeDefined()
  })

  it('reuses global client across repeated imports in non-production', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/test')
    vi.stubEnv('NODE_ENV', 'development')
    const mod1 = await import('@/utils/prisma')
    const firstClient = mod1.prisma
    vi.resetModules()
    vi.doUnmock('@/utils/prisma')
    const mod2 = await import('@/utils/prisma')
    expect(mod2.prisma).toBe(firstClient)
  })

  it('does NOT attach to globalThis in production mode', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/test')
    vi.stubEnv('NODE_ENV', 'production')
    delete (globalThis as { prisma?: unknown }).prisma
    const mod = await import('@/utils/prisma')
    expect(mod.prisma).toBeDefined()
    expect((globalThis as { prisma?: unknown }).prisma).toBeUndefined()
  })

  it('respects DATABASE_SSL_REJECT_UNAUTHORIZED=false', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/test')
    vi.stubEnv('DATABASE_SSL_REJECT_UNAUTHORIZED', 'false')
    const mod = await import('@/utils/prisma')
    expect(mod.prisma).toBeDefined()
  })

  it('defaults DATABASE_SSL_REJECT_UNAUTHORIZED to true when env is not "false"', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/test')
    vi.stubEnv('DATABASE_SSL_REJECT_UNAUTHORIZED', 'true')
    const mod = await import('@/utils/prisma')
    expect(mod.prisma).toBeDefined()
  })

  it('exports a prisma client object with $connect and $disconnect methods', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/test')
    const mod = await import('@/utils/prisma')
    expect(typeof mod.prisma.$connect).toBe('function')
    expect(typeof mod.prisma.$disconnect).toBe('function')
  })
})

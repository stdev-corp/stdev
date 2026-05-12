import { describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/auth'

vi.mock('better-auth/next-js', () => ({
  toNextJsHandler: vi.fn(() => ({
    GET: vi.fn(),
    POST: vi.fn(),
  })),
}))

describe('api/auth/[...all] route', () => {
  it('exports a GET handler', async () => {
    const routeModule = await import('@/app/api/auth/[...all]/route')
    expect(routeModule.GET).toBeDefined()
    expect(typeof routeModule.GET).toBe('function')
  })

  it('exports a POST handler', async () => {
    const routeModule = await import('@/app/api/auth/[...all]/route')
    expect(routeModule.POST).toBeDefined()
    expect(typeof routeModule.POST).toBe('function')
  })

  it('imports without throwing', async () => {
    await expect(import('@/app/api/auth/[...all]/route')).resolves.toBeDefined()
  })
})

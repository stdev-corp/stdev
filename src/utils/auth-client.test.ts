import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAuthClientMock = vi.fn(() => ({ __mock: true }))

vi.mock('better-auth/react', () => ({
  createAuthClient: createAuthClientMock,
}))

describe('auth-client', () => {
  beforeEach(() => {
    vi.resetModules()
    createAuthClientMock.mockClear()
    createAuthClientMock.mockImplementation(() => ({ __mock: true }))
  })

  it('exports authClient that is defined', async () => {
    const mod = await import('@/utils/auth-client')
    expect(mod.authClient).toBeDefined()
    expect(mod.authClient).toBeTruthy()
  })

  it('authClient is the object returned by createAuthClient', async () => {
    const mod = await import('@/utils/auth-client')
    expect(mod.authClient).toEqual({ __mock: true })
  })

  it('calls createAuthClient exactly once during module init', async () => {
    await import('@/utils/auth-client')
    expect(createAuthClientMock).toHaveBeenCalledTimes(1)
  })

  it('exposes authClient as a named export', async () => {
    const mod = await import('@/utils/auth-client')
    expect(Object.keys(mod)).toContain('authClient')
  })
})

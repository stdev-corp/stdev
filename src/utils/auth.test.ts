import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.unmock('@/utils/auth')

const sessionDeleteManyMock = vi.fn(async () => ({ count: 1 }))

vi.mock('@/utils/prisma', () => ({
  prisma: {
    session: { deleteMany: sessionDeleteManyMock },
  },
}))

const betterAuthMock = vi.fn(
  (config: Record<string, unknown>) => ({ __config: config }) as const,
)

vi.mock('better-auth', () => ({
  betterAuth: (config: Record<string, unknown>) => betterAuthMock(config),
}))

const apiErrorFromMock = vi.fn((status: string, data: unknown) => {
  const err = new Error(`APIError:${status}`) as Error & {
    status?: string
    data?: unknown
  }
  err.status = status
  err.data = data
  return err
})

vi.mock('better-auth/api', () => ({
  APIError: { from: apiErrorFromMock },
  createAuthMiddleware: (fn: unknown) => fn,
}))

vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: vi.fn((_prisma: unknown, opts: unknown) => ({
    __adapter: opts,
  })),
}))

vi.mock('better-auth/next-js', () => ({
  nextCookies: vi.fn(() => ({ __plugin: 'nextCookies' })),
}))

function setRequiredEnv() {
  vi.stubEnv('BETTER_AUTH_SECRET', 'secret-1')
  vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000')
  vi.stubEnv('GOOGLE_CLIENT_ID', 'google-id')
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'google-secret')
}

describe('auth required env vars', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doUnmock('@/utils/auth')
    sessionDeleteManyMock.mockClear()
    apiErrorFromMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when BETTER_AUTH_SECRET missing', async () => {
    vi.stubEnv('BETTER_AUTH_SECRET', '')
    vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'gid')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'gsecret')
    await expect(import('@/utils/auth')).rejects.toThrow(
      'BETTER_AUTH_SECRET is required',
    )
  })

  it('throws when BETTER_AUTH_URL missing', async () => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'secret')
    vi.stubEnv('BETTER_AUTH_URL', '')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'gid')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'gsecret')
    await expect(import('@/utils/auth')).rejects.toThrow(
      'BETTER_AUTH_URL is required',
    )
  })

  it('throws when GOOGLE_CLIENT_ID missing', async () => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'secret')
    vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000')
    vi.stubEnv('GOOGLE_CLIENT_ID', '')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'gsecret')
    await expect(import('@/utils/auth')).rejects.toThrow(
      'GOOGLE_CLIENT_ID is required',
    )
  })

  it('throws when GOOGLE_CLIENT_SECRET missing', async () => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'secret')
    vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'gid')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '')
    await expect(import('@/utils/auth')).rejects.toThrow(
      'GOOGLE_CLIENT_SECRET is required',
    )
  })

  it('exposes auth export when all envs are set', async () => {
    setRequiredEnv()
    const mod = await import('@/utils/auth')
    expect(mod.auth).toBeDefined()
    expect(
      (mod.auth as unknown as { __config: { secret: string } }).__config.secret,
    ).toBe('secret-1')
  })
})

describe('auth after hook (email domain guard)', () => {
  type HookCtx = {
    path: string
    context: {
      newSession: null | { user: { id: string; email: string } }
    }
  }

  async function loadAuthAndHook(): Promise<
    (ctx: HookCtx) => Promise<unknown>
  > {
    const mod = await import('@/utils/auth')
    const config = (
      mod.auth as unknown as { __config: Record<string, unknown> }
    ).__config
    const hooks = config.hooks as { after: (ctx: HookCtx) => Promise<unknown> }
    return hooks.after
  }

  beforeEach(() => {
    vi.resetModules()
    vi.doUnmock('@/utils/auth')
    sessionDeleteManyMock.mockClear()
    apiErrorFromMock.mockClear()
    setRequiredEnv()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns early when path is not callback or sign-in', async () => {
    const hook = await loadAuthAndHook()
    const result = await hook({
      path: '/some/other',
      context: {
        newSession: { user: { id: 'u1', email: 'bad@example.com' } },
      },
    })
    expect(result).toBeUndefined()
    expect(sessionDeleteManyMock).not.toHaveBeenCalled()
    expect(apiErrorFromMock).not.toHaveBeenCalled()
  })

  it('returns early when newSession is null on valid path', async () => {
    const hook = await loadAuthAndHook()
    const result = await hook({
      path: '/callback/google',
      context: { newSession: null },
    })
    expect(result).toBeUndefined()
    expect(sessionDeleteManyMock).not.toHaveBeenCalled()
    expect(apiErrorFromMock).not.toHaveBeenCalled()
  })

  it('deletes sessions and throws APIError for non-stdev email on /callback/google', async () => {
    const hook = await loadAuthAndHook()
    await expect(
      hook({
        path: '/callback/google',
        context: {
          newSession: { user: { id: 'u-bad', email: 'evil@example.com' } },
        },
      }),
    ).rejects.toThrow('APIError:FORBIDDEN')
    expect(sessionDeleteManyMock).toHaveBeenCalledWith({
      where: { userId: 'u-bad' },
    })
    expect(apiErrorFromMock).toHaveBeenCalledWith('FORBIDDEN', {
      code: 'UNAUTHORIZED_ADMIN_DOMAIN',
      message: 'Only @stdev.kr Google accounts can access admin.',
    })
  })

  it('deletes sessions and throws APIError for non-stdev email on /sign-in/social', async () => {
    const hook = await loadAuthAndHook()
    await expect(
      hook({
        path: '/sign-in/social',
        context: {
          newSession: { user: { id: 'u-2', email: 'user@gmail.com' } },
        },
      }),
    ).rejects.toThrow('APIError:FORBIDDEN')
    expect(sessionDeleteManyMock).toHaveBeenCalledWith({
      where: { userId: 'u-2' },
    })
  })

  it('allows @stdev.kr email without deleting or throwing', async () => {
    const hook = await loadAuthAndHook()
    await hook({
      path: '/callback/google',
      context: {
        newSession: { user: { id: 'u-ok', email: 'admin@stdev.kr' } },
      },
    })
    expect(sessionDeleteManyMock).not.toHaveBeenCalled()
    expect(apiErrorFromMock).not.toHaveBeenCalled()
  })

  it('allows uppercase @STDEV.KR email via toLowerCase path', async () => {
    const hook = await loadAuthAndHook()
    await hook({
      path: '/callback/google',
      context: {
        newSession: { user: { id: 'u-upper', email: 'ADMIN@STDEV.KR' } },
      },
    })
    expect(sessionDeleteManyMock).not.toHaveBeenCalled()
    expect(apiErrorFromMock).not.toHaveBeenCalled()
  })

  it('allows mixed-case @Stdev.Kr email via toLowerCase path', async () => {
    const hook = await loadAuthAndHook()
    await hook({
      path: '/sign-in/social',
      context: {
        newSession: { user: { id: 'u-mix', email: 'Name@Stdev.Kr' } },
      },
    })
    expect(sessionDeleteManyMock).not.toHaveBeenCalled()
    expect(apiErrorFromMock).not.toHaveBeenCalled()
  })
})

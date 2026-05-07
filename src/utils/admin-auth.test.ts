import { beforeEach, describe, expect, it } from 'vitest'
import { prismaMock, resetPrismaMock } from '@/tests/mocks/prisma'
import {
  getSessionMock,
  mockAllowedAdminSession,
  mockNoSession,
  mockNonAdminSession,
  resetAuthMocks,
} from '@/tests/mocks/auth'
import {
  forbiddenMock,
  redirectMock,
  resetNavigationMocks,
} from '@/tests/mocks/navigation'
import { resetHeadersMocks } from '@/tests/mocks/headers'
import {
  requireAdminActionSession,
  requireAdminPageSession,
} from '@/utils/admin-auth'

beforeEach(() => {
  resetPrismaMock()
  resetAuthMocks()
  resetNavigationMocks()
  resetHeadersMocks()
})

describe('requireAdminPageSession', () => {
  it('redirects to /admin/sign-in when there is no session', async () => {
    mockNoSession()
    await expect(requireAdminPageSession()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/admin/sign-in')
    expect(forbiddenMock).not.toHaveBeenCalled()
    expect(prismaMock.account.findFirst).not.toHaveBeenCalled()
  })

  it('forbidden when session email does not end with @stdev.kr', async () => {
    mockNonAdminSession()
    await expect(requireAdminPageSession()).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;403',
    )
    expect(forbiddenMock).toHaveBeenCalledTimes(1)
    expect(prismaMock.account.findFirst).not.toHaveBeenCalled()
  })

  it('forbidden when @stdev.kr user has no google account', async () => {
    mockAllowedAdminSession({ id: 'user-1' })
    prismaMock.account.findFirst.mockResolvedValue(null)
    await expect(requireAdminPageSession()).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;403',
    )
    expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', providerId: 'google' },
      select: { id: true },
    })
    expect(forbiddenMock).toHaveBeenCalledTimes(1)
  })

  it('returns the session when @stdev.kr user has a google account', async () => {
    const session = mockAllowedAdminSession({ id: 'user-2' })
    prismaMock.account.findFirst.mockResolvedValue({ id: 'acc-1' } as never)
    const result = await requireAdminPageSession()
    expect(result).toBe(session)
    expect(redirectMock).not.toHaveBeenCalled()
    expect(forbiddenMock).not.toHaveBeenCalled()
    expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-2', providerId: 'google' },
      select: { id: true },
    })
  })

  it('allows uppercase @STDEV.KR email via toLowerCase path', async () => {
    mockAllowedAdminSession({
      id: 'user-upper',
      email: 'ADMIN@STDEV.KR',
    })
    prismaMock.account.findFirst.mockResolvedValue({ id: 'acc-x' } as never)
    await expect(requireAdminPageSession()).resolves.toBeDefined()
    expect(forbiddenMock).not.toHaveBeenCalled()
  })

  it('allows mixed-case @Stdev.Kr email via toLowerCase path', async () => {
    mockAllowedAdminSession({
      id: 'user-mix',
      email: 'Name@Stdev.Kr',
    })
    prismaMock.account.findFirst.mockResolvedValue({ id: 'acc-y' } as never)
    await expect(requireAdminPageSession()).resolves.toBeDefined()
    expect(forbiddenMock).not.toHaveBeenCalled()
  })

  it('does NOT redirect when email is non-stdev (goes to forbidden instead)', async () => {
    mockNonAdminSession()
    await expect(requireAdminPageSession()).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;403',
    )
    expect(redirectMock).not.toHaveBeenCalled()
  })
})

describe('requireAdminActionSession', () => {
  it('forbidden (no redirect) when there is no session', async () => {
    mockNoSession()
    await expect(requireAdminActionSession()).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;403',
    )
    expect(forbiddenMock).toHaveBeenCalledTimes(1)
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('forbidden when email does not end with @stdev.kr', async () => {
    mockNonAdminSession()
    await expect(requireAdminActionSession()).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;403',
    )
    expect(forbiddenMock).toHaveBeenCalledTimes(1)
  })

  it('forbidden when @stdev.kr user has no google account', async () => {
    mockAllowedAdminSession({ id: 'user-3' })
    prismaMock.account.findFirst.mockResolvedValue(null)
    await expect(requireAdminActionSession()).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;403',
    )
    expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-3', providerId: 'google' },
      select: { id: true },
    })
  })

  it('returns the session when @stdev.kr user has a google account', async () => {
    const session = mockAllowedAdminSession({ id: 'user-4' })
    prismaMock.account.findFirst.mockResolvedValue({ id: 'acc-z' } as never)
    const result = await requireAdminActionSession()
    expect(result).toBe(session)
    expect(forbiddenMock).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('queries session via auth.api.getSession', async () => {
    const session = mockAllowedAdminSession()
    prismaMock.account.findFirst.mockResolvedValue({ id: 'acc' } as never)
    await requireAdminActionSession()
    expect(getSessionMock).toHaveBeenCalledTimes(1)
    expect(session).toBeDefined()
  })
})

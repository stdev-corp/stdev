import { vi } from 'vitest'

export const requireAdminPageSessionMock = vi.fn()
export const requireAdminActionSessionMock = vi.fn()

vi.mock('@/utils/admin-auth', () => ({
  requireAdminPageSession: requireAdminPageSessionMock,
  requireAdminActionSession: requireAdminActionSessionMock,
}))

export function resetAdminAuthMocks() {
  requireAdminPageSessionMock.mockReset()
  requireAdminActionSessionMock.mockReset()
}

export function mockAdminAuthAllowed() {
  const session = {
    user: {
      id: 'user-stdev-1',
      email: 'admin@stdev.kr',
      name: 'Admin',
      emailVerified: true,
      image: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
    session: {
      id: 'session-1',
      token: 'session-token',
      userId: 'user-stdev-1',
      expiresAt: new Date(Date.now() + 3_600_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  }
  requireAdminPageSessionMock.mockResolvedValue(session)
  requireAdminActionSessionMock.mockResolvedValue(session)
  return session
}

export function mockAdminAuthForbidden() {
  const err = new Error('NEXT_HTTP_ERROR_FALLBACK;403') as Error & {
    digest?: string
  }
  err.digest = 'NEXT_HTTP_ERROR_FALLBACK;403'
  requireAdminPageSessionMock.mockRejectedValue(err)
  requireAdminActionSessionMock.mockRejectedValue(err)
}

export function mockAdminAuthRedirect() {
  const err = new Error('NEXT_REDIRECT;/admin/sign-in') as Error & {
    digest?: string
  }
  err.digest = 'NEXT_REDIRECT;push;/admin/sign-in;307;'
  requireAdminPageSessionMock.mockRejectedValue(err)
  requireAdminActionSessionMock.mockRejectedValue(err)
}

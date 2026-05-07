import { vi } from 'vitest'

export type MockSessionUser = {
  id: string
  email: string
  emailVerified?: boolean
  name?: string
  image?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export type MockSession = {
  user: MockSessionUser
  session: {
    id: string
    token: string
    userId: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    ipAddress?: string | null
    userAgent?: string | null
  }
} | null

export const getSessionMock = vi.fn<() => Promise<MockSession>>(
  async () => null,
)

export const authApiMock = {
  getSession: getSessionMock,
}

vi.mock('@/utils/auth', () => ({
  auth: {
    api: authApiMock,
    handler: vi.fn(),
  },
}))

export function resetAuthMocks() {
  getSessionMock.mockReset()
  getSessionMock.mockImplementation(async () => null)
}

export function mockAllowedAdminSession(
  overrides: Partial<MockSessionUser> = {},
): MockSession {
  const session: MockSession = {
    user: {
      id: 'user-stdev-1',
      email: 'admin@stdev.kr',
      name: 'Admin User',
      emailVerified: true,
      image: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    },
    session: {
      id: 'session-1',
      token: 'session-token',
      userId: overrides.id ?? 'user-stdev-1',
      expiresAt: new Date(Date.now() + 3_600_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    },
  }
  getSessionMock.mockResolvedValue(session)
  return session
}

export function mockNonAdminSession(): MockSession {
  const session: MockSession = {
    user: {
      id: 'user-2',
      email: 'guest@gmail.com',
      name: 'Guest',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: 'session-2',
      token: 'token-2',
      userId: 'user-2',
      expiresAt: new Date(Date.now() + 3_600_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  }
  getSessionMock.mockResolvedValue(session)
  return session
}

export function mockNoSession(): void {
  getSessionMock.mockResolvedValue(null)
}

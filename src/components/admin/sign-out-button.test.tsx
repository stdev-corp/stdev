import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { authClient } from '@/utils/auth-client'
import { SignOutButton } from './sign-out-button'

vi.mock('@/utils/auth-client', () => ({
  authClient: {
    signOut: vi.fn(),
  },
}))

const signOutMock = authClient.signOut as unknown as ReturnType<typeof vi.fn>

describe('SignOutButton', () => {
  beforeEach(() => {
    signOutMock.mockReset()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    })
  })

  it('signs out and redirects to admin sign-in', async () => {
    signOutMock.mockResolvedValue(undefined)
    const { user } = renderWithChakra(<SignOutButton />)

    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(signOutMock).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => {
      expect(window.location.href).toBe('/admin/sign-in')
    })
  })
})

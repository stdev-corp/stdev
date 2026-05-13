import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/navigation'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import { AdminShell } from './admin-shell'

vi.mock('./sign-out-button', () => ({
  SignOutButton: () => <button>로그아웃</button>,
}))

describe('AdminShell', () => {
  beforeEach(() => {
    resetNavigationMocks()
    usePathnameMock.mockReturnValue('/admin/settings')
  })

  it('renders sidebar navigation, session email, and children', () => {
    renderWithChakra(
      <AdminShell sessionEmail="admin@example.com">
        <p>관리자 본문</p>
      </AdminShell>,
    )

    expect(screen.getByText('STDev CMS')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('관리자 본문')).toBeInTheDocument()
    expect(screen.getByText('대시보드').closest('a')).toHaveAttribute(
      'href',
      '/admin',
    )
    expect(screen.getByText('설정').closest('a')).toHaveAttribute(
      'href',
      '/admin/settings',
    )
    expect(screen.getByText('로그아웃')).toBeInTheDocument()
  })

  it('opens the mobile drawer from hamburger button', async () => {
    const { user } = renderWithChakra(
      <AdminShell sessionEmail="admin@example.com">
        <p>관리자 본문</p>
      </AdminShell>,
    )

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('STDev CMS')).toHaveLength(2)

    await user.click(screen.getAllByText('AWS').at(-1)!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

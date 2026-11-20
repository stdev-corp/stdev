import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/navigation'
import { renderWithChakra, screen, waitFor } from '@/tests/utils/render'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import { AdminShell } from './admin-shell'
import { adminMenuItems } from './menu-items'

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

  it('lists every admin menu item, including event sub-pages, in order', () => {
    renderWithChakra(
      <AdminShell sessionEmail="admin@example.com">
        <p>본문</p>
      </AdminShell>,
    )

    const links = document.querySelector('nav')!.querySelectorAll('a')
    expect(
      Array.from(links).map((link) => [
        link.textContent,
        link.getAttribute('href'),
      ]),
    ).toEqual(adminMenuItems.map((item) => [item.label, item.href]))
    expect(adminMenuItems.slice(0, 3)).toEqual([
      { label: '대시보드', href: '/admin' },
      { label: '사업(행사)', href: '/admin/businesses' },
      { label: '행사 하위 페이지', href: '/admin/business-pages' },
    ])
  })

  it('highlights only the event sub-page menu on /admin/business-pages', () => {
    usePathnameMock.mockReturnValue('/admin/business-pages/12')
    renderWithChakra(
      <AdminShell sessionEmail="admin@example.com">
        <p>본문</p>
      </AdminShell>,
    )

    const nav = document.querySelector('nav')!
    const classOf = (label: string) =>
      Array.from(nav.querySelectorAll('a')).find(
        (link) => link.textContent === label,
      )!.className
    expect(classOf('행사 하위 페이지')).not.toBe(classOf('사업(행사)'))
    expect(classOf('사업(행사)')).toBe(classOf('이미지'))
    expect(classOf('대시보드')).toBe(classOf('이미지'))
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
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('closes the mobile drawer with the Escape key', async () => {
    const { user } = renderWithChakra(
      <AdminShell sessionEmail="admin@example.com">
        <p>관리자 본문</p>
      </AdminShell>,
    )

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })
})

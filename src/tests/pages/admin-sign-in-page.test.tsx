import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import SignInPage from '@/app/(cms)/admin/sign-in/page'

vi.mock('@/utils/auth-client', () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}))

describe('SignInPage', () => {
  it('renders STDev CMS 로그인 heading', () => {
    renderWithChakra(<SignInPage />)
    expect(
      screen.getByRole('heading', { name: 'STDev CMS 로그인' }),
    ).toBeInTheDocument()
  })

  it('renders the Google sign-in description paragraph', () => {
    renderWithChakra(<SignInPage />)
    expect(
      screen.getByText('STDev Google 계정으로 로그인하세요.'),
    ).toBeInTheDocument()
  })

  it('renders the @stdev.kr restriction notice on the page (outside form)', () => {
    renderWithChakra(<SignInPage />)
    expect(
      screen.getByText(
        '관리자는 Google로 연결된 @stdev.kr 계정만 접근할 수 있습니다.',
      ),
    ).toBeInTheDocument()
  })

  it('renders SignInForm (Google button)', () => {
    renderWithChakra(<SignInPage />)
    expect(
      screen.getByRole('button', { name: 'Google 계정으로 로그인' }),
    ).toBeInTheDocument()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import SignInForm from '@/app/(cms)/admin/sign-in/sign-in-form'
import { authClient } from '@/utils/auth-client'

vi.mock('@/utils/auth-client', () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}))

const socialMock = authClient.signIn.social as unknown as ReturnType<
  typeof vi.fn
>

describe('SignInForm', () => {
  beforeEach(() => {
    socialMock.mockReset()
  })

  it('renders Google 계정으로 로그인 button', () => {
    renderWithChakra(<SignInForm />)
    expect(
      screen.getByRole('button', { name: 'Google 계정으로 로그인' }),
    ).toBeInTheDocument()
  })

  it('renders the @stdev.kr restriction notice', () => {
    renderWithChakra(<SignInForm />)
    expect(
      screen.getByText(
        '관리자는 Google로 연결된 @stdev.kr 계정만 접근할 수 있습니다.',
      ),
    ).toBeInTheDocument()
  })

  it('does not show an error message on initial render', () => {
    const { container } = renderWithChakra(<SignInForm />)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('calls authClient.signIn.social with expected arguments on click', async () => {
    socialMock.mockResolvedValue({ error: null })
    const { user } = renderWithChakra(<SignInForm />)
    await user.click(
      screen.getByRole('button', { name: 'Google 계정으로 로그인' }),
    )
    expect(socialMock).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/admin',
      errorCallbackURL: '/admin/sign-in',
    })
  })

  it('shows the error message returned from authClient', async () => {
    socialMock.mockResolvedValue({
      error: { message: '권한이 없습니다.' },
    })
    const { user } = renderWithChakra(<SignInForm />)
    await user.click(
      screen.getByRole('button', { name: 'Google 계정으로 로그인' }),
    )
    expect(await screen.findByText('권한이 없습니다.')).toBeInTheDocument()
  })

  it('falls back to Korean generic message when error has no message', async () => {
    socialMock.mockResolvedValue({ error: {} })
    const { user } = renderWithChakra(<SignInForm />)
    await user.click(
      screen.getByRole('button', { name: 'Google 계정으로 로그인' }),
    )
    expect(
      await screen.findByText('로그인에 실패했습니다.'),
    ).toBeInTheDocument()
  })

  it('does not render an error when result has no error', async () => {
    socialMock.mockResolvedValue({ error: null })
    const { user, container } = renderWithChakra(<SignInForm />)
    await user.click(
      screen.getByRole('button', { name: 'Google 계정으로 로그인' }),
    )
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })
})

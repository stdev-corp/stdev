import { describe, expect, it, vi } from 'vitest'
import {
  renderAsyncServerComponent,
  renderWithChakra,
  screen,
} from '@/tests/utils/render'
import LoadingPage from '@/app/(stdev)/loading'
import NotFoundPage from '@/app/(stdev)/not-found'
import ForbiddenPage from '@/app/(stdev)/forbidden'
import UnauthorizedPage from '@/app/(stdev)/unauthorized'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

describe('LoadingPage', () => {
  it('renders a spinner element', () => {
    const { container } = renderWithChakra(<LoadingPage />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => renderWithChakra(<LoadingPage />)).not.toThrow()
  })
})

describe('NotFoundPage', () => {
  it('renders 404 Not Found title', async () => {
    await renderAsyncServerComponent(() => NotFoundPage())
    expect(
      screen.getByRole('heading', { name: '404 Not Found' }),
    ).toBeInTheDocument()
  })

  it('renders not found message', async () => {
    await renderAsyncServerComponent(() => NotFoundPage())
    expect(
      screen.getByText('요청하신 페이지를 찾을 수 없습니다.'),
    ).toBeInTheDocument()
  })

  it('renders URL check suggestion', async () => {
    await renderAsyncServerComponent(() => NotFoundPage())
    expect(screen.getByText('URL을 다시 확인해 보세요.')).toBeInTheDocument()
  })

  it('renders home link', async () => {
    await renderAsyncServerComponent(() => NotFoundPage())
    expect(
      screen.getByRole('link', { name: '홈페이지로 돌아가기' }),
    ).toBeInTheDocument()
  })
})

describe('ForbiddenPage', () => {
  it('renders 403 Forbidden title', async () => {
    await renderAsyncServerComponent(() => ForbiddenPage())
    expect(
      screen.getByRole('heading', { name: '403 Forbidden' }),
    ).toBeInTheDocument()
  })

  it('renders access denied message', async () => {
    await renderAsyncServerComponent(() => ForbiddenPage())
    expect(
      screen.getByText('이 페이지에 접근할 권한이 없습니다.'),
    ).toBeInTheDocument()
  })

  it('renders account switch suggestion', async () => {
    await renderAsyncServerComponent(() => ForbiddenPage())
    expect(
      screen.getByText(
        '관리자 페이지에 접근을 시도하셨다면 다른 계정으로 로그인해 보세요.',
      ),
    ).toBeInTheDocument()
  })

  it('renders home link', async () => {
    await renderAsyncServerComponent(() => ForbiddenPage())
    expect(
      screen.getByRole('link', { name: '홈페이지로 돌아가기' }),
    ).toBeInTheDocument()
  })
})

describe('UnauthorizedPage', () => {
  it('renders 401 Unauthorized title', async () => {
    await renderAsyncServerComponent(() => UnauthorizedPage())
    expect(
      screen.getByRole('heading', { name: '401 Unauthorized' }),
    ).toBeInTheDocument()
  })

  it('renders unauthorized message', async () => {
    await renderAsyncServerComponent(() => UnauthorizedPage())
    expect(
      screen.getByText('이 페이지에 접근할 권한이 없습니다.'),
    ).toBeInTheDocument()
  })

  it('renders login suggestion', async () => {
    await renderAsyncServerComponent(() => UnauthorizedPage())
    expect(
      screen.getByText(
        '로그인이 필요한 페이지에 접근을 시도하셨다면 로그인해 보세요.',
      ),
    ).toBeInTheDocument()
  })

  it('renders home link', async () => {
    await renderAsyncServerComponent(() => UnauthorizedPage())
    expect(
      screen.getByRole('link', { name: '홈페이지로 돌아가기' }),
    ).toBeInTheDocument()
  })
})

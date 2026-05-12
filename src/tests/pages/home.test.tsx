import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryInstitutionsMock, resetCmsMocks } from '@/tests/mocks/cms'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import HomePage from '@/app/(stdev)/page'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fetchPriority: _fp, ...rest } = props as {
      fetchPriority?: string
      [key: string]: unknown
    }
    return <img {...rest} />
  },
}))

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

vi.mock('@/components/layout/navbar', () => ({
  default: () => <nav data-testid="navbar" />,
}))

vi.mock('@/components/layout/footer', () => ({
  default: () => <footer data-testid="footer" />,
}))

describe('HomePage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders heading for partner institutions', async () => {
    queryInstitutionsMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => HomePage())
    expect(
      screen.getByRole('heading', { name: '함께하는 기관' }),
    ).toBeInTheDocument()
  })

  it('renders title image', async () => {
    queryInstitutionsMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => HomePage())
    const titleImg = screen.getByAltText('title')
    expect(titleImg).toBeInTheDocument()
  })

  it('renders with empty institutions without crashing', async () => {
    queryInstitutionsMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => HomePage())
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders with populated institutions', async () => {
    queryInstitutionsMock.mockResolvedValue([
      {
        imageUrl:
          'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo1.png',
        imageAlt: '기관1',
      },
      {
        imageUrl:
          'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo2.png',
        imageAlt: '기관2',
      },
    ])
    await renderAsyncServerComponent(() => HomePage())
    expect(
      screen.getByRole('heading', { name: '함께하는 기관' }),
    ).toBeInTheDocument()
  })

  it('calls queryInstitutions exactly once', async () => {
    await renderAsyncServerComponent(() => HomePage())
    expect(queryInstitutionsMock).toHaveBeenCalledOnce()
  })
})

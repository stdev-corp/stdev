import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryInstitutionsMock, resetCmsMocks } from '@/tests/mocks/cms'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import HomePage from '@/app/(stdev)/page'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      fetchPriority: _fp,
      fill: _fill,
      ...rest
    } = props as {
      fetchPriority?: string
      fill?: boolean
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

vi.mock('@/components/krds/main-layout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}))

describe('HomePage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders heading for partner institutions', async () => {
    queryInstitutionsMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => HomePage())
    const heading = screen.getByRole('heading', {
      name: '함께하는 기관',
      level: 2,
    })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveClass('section-tit')
  })

  it('renders title image', async () => {
    queryInstitutionsMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => HomePage())
    const titleImg = screen.getByAltText(
      'STDev - 개발자를 위한 커뮤니티를 만듭니다',
    )
    expect(titleImg).toBeInTheDocument()
    expect(titleImg).toHaveAttribute('src', '/images/intro/title.png')
  })

  it('renders with empty institutions without crashing', async () => {
    queryInstitutionsMock.mockResolvedValue([])
    await renderAsyncServerComponent(() => HomePage())
    const layout = screen.getByTestId('main-layout')
    expect(layout).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '사단법인 STDev', level: 1 }),
    ).toBeInTheDocument()
    expect(layout.querySelector('.logo-marquee')).toBeNull()
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
      screen.getByRole('heading', { name: '함께하는 기관', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getAllByAltText('기관1').length).toBeGreaterThan(0)
    expect(screen.getAllByAltText('기관2').length).toBeGreaterThan(0)
  })

  it('calls queryInstitutions exactly once', async () => {
    await renderAsyncServerComponent(() => HomePage())
    expect(queryInstitutionsMock).toHaveBeenCalledOnce()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLatestMarkdownByTypeMock, resetCmsMocks } from '@/tests/mocks/cms'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import PrivacyPage from '@/app/(stdev)/info/privacy/page'
import TermsPage from '@/app/(stdev)/info/terms/page'
import SitemapPage from '@/app/(stdev)/info/sitemap/page'
import { makeMarkdown } from '@/tests/utils/fixtures'
import { AllMenus, IntroMenu } from '@/utils/menus'

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

vi.mock('@/components/markdown/markdown-view', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown-view">{content}</div>
  ),
}))

describe('PrivacyPage', () => {
  beforeEach(() => resetCmsMocks())

  describe('when no privacy policy is registered', () => {
    it('renders 개인정보처리방침 heading', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(null)
      await renderAsyncServerComponent(() => PrivacyPage())
      expect(
        screen.getByRole('heading', { name: '개인정보처리방침' }),
      ).toBeInTheDocument()
    })

    it('shows fallback message', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(null)
      await renderAsyncServerComponent(() => PrivacyPage())
      expect(
        screen.getByText('개인정보처리방침이 등록되지 않았습니다.'),
      ).toBeInTheDocument()
    })
  })

  describe('when privacy policy is present', () => {
    it('renders full association heading', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(
        makeMarkdown({ type: 'privacy', content: '# 개인정보처리방침' }),
      )
      await renderAsyncServerComponent(() => PrivacyPage())
      expect(
        screen.getByRole('heading', {
          name: '사단법인 에스티데브 개인정보처리방침',
        }),
      ).toBeInTheDocument()
    })

    it('renders revision date', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(
        makeMarkdown({
          type: 'privacy',
          revisionDate: new Date('2026-03-01T00:00:00Z'),
          effectiveDate: new Date('2026-03-15T00:00:00Z'),
          content: '내용',
        }),
      )
      await renderAsyncServerComponent(() => PrivacyPage())
      expect(screen.getByText(/2026년 3월 1일/)).toBeInTheDocument()
    })

    it('renders effective date', async () => {
      getLatestMarkdownByTypeMock.mockResolvedValue(
        makeMarkdown({
          type: 'privacy',
          revisionDate: new Date('2026-03-01T00:00:00Z'),
          effectiveDate: new Date('2026-03-15T00:00:00Z'),
          content: '내용',
        }),
      )
      await renderAsyncServerComponent(() => PrivacyPage())
      expect(screen.getByText(/2026년 3월 15일/)).toBeInTheDocument()
    })
  })

  it('calls getLatestMarkdownByType with privacy', async () => {
    await renderAsyncServerComponent(() => PrivacyPage())
    expect(getLatestMarkdownByTypeMock).toHaveBeenCalledWith('privacy')
  })
})

describe('TermsPage', () => {
  beforeEach(() => resetCmsMocks())

  it('renders 이용약관 heading when no terms registered', async () => {
    getLatestMarkdownByTypeMock.mockResolvedValue(null)
    await renderAsyncServerComponent(() => TermsPage())
    expect(
      screen.getByRole('heading', { name: '이용약관' }),
    ).toBeInTheDocument()
  })

  it('shows fallback message when no terms', async () => {
    getLatestMarkdownByTypeMock.mockResolvedValue(null)
    await renderAsyncServerComponent(() => TermsPage())
    expect(
      screen.getByText('이용약관이 등록되지 않았습니다.'),
    ).toBeInTheDocument()
  })

  it('renders full association heading when terms present', async () => {
    getLatestMarkdownByTypeMock.mockResolvedValue(
      makeMarkdown({ type: 'terms', content: '# 이용약관' }),
    )
    await renderAsyncServerComponent(() => TermsPage())
    expect(
      screen.getByRole('heading', { name: '사단법인 에스티데브 이용약관' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('markdown-view')).toBeInTheDocument()
  })

  it('calls getLatestMarkdownByType with terms', async () => {
    await renderAsyncServerComponent(() => TermsPage())
    expect(getLatestMarkdownByTypeMock).toHaveBeenCalledWith('terms')
  })
})

describe('SitemapPage', () => {
  it('renders 사이트맵 heading', async () => {
    await renderAsyncServerComponent(() => SitemapPage())
    expect(
      screen.getByRole('heading', { name: '사이트맵' }),
    ).toBeInTheDocument()
  })

  it('renders every section as a plain heading, not a link', async () => {
    await renderAsyncServerComponent(() => SitemapPage())
    for (const menu of AllMenus) {
      const heading = screen.getByRole('heading', { name: menu.label })
      expect(heading).toBeInTheDocument()
      // 구역 자체의 페이지가 없으므로 제목은 링크가 아니다.
      expect(heading.querySelector('a')).toBeNull()
      expect(screen.queryByRole('link', { name: menu.label })).toBeNull()
    }
  })

  it('renders every intro sub menu as a link, starting with 사단법인 에스티데브', async () => {
    await renderAsyncServerComponent(() => SitemapPage())
    expect(IntroMenu.subMenus[0].label).toBe('사단법인 에스티데브')
    for (const subMenu of IntroMenu.subMenus) {
      expect(screen.getByRole('link', { name: subMenu.label })).toHaveAttribute(
        'href',
        subMenu.href,
      )
    }
  })

  it('renders exactly one link per sub menu across all sections', async () => {
    await renderAsyncServerComponent(() => SitemapPage())
    expect(screen.getAllByRole('link')).toHaveLength(
      AllMenus.reduce((count, menu) => count + menu.subMenus.length, 0),
    )
  })
})

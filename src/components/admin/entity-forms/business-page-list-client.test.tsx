import { describe, expect, it, vi } from 'vitest'
import { act, renderWithChakra, screen, waitFor } from '@/tests/utils/render'
import { makeBusinessPage, makeImageAsset } from '@/tests/utils/fixtures'
import { BusinessPageListClient } from './business-page-list-client'
import { FormDrawer } from '../form-drawer'

// 실제 드로어를 그대로 그리되, 받은 props를 꺼내 쓸 수 있게 감싼다.
vi.mock('../form-drawer', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../form-drawer')>()
  return { ...mod, FormDrawer: vi.fn(mod.FormDrawer) }
})

function lastDrawerProps(title: string) {
  return vi
    .mocked(FormDrawer)
    .mock.calls.map(([props]) => props)
    .findLast((props) => props.title === title)!
}

vi.mock('../toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}))

const actions = {
  createBusinessPage: vi.fn<(formData: FormData) => Promise<void>>(
    async () => {},
  ),
  updateBusinessPage: vi.fn<(formData: FormData) => Promise<void>>(
    async () => {},
  ),
  deleteBusinessPage: vi.fn<(formData: FormData) => Promise<void>>(
    async () => {},
  ),
}

const businesses = [
  { id: 1, name: 'DSF 2026', slug: 'dsf26', category: 'hackathon' as const },
  { id: 2, name: '옛 행사', slug: null, category: 'conference' as const },
]

const images = [makeImageAsset({ id: 3, filename: 'cover.png' })]

function renderList(pages: ReturnType<typeof makeBusinessPage>[]) {
  return renderWithChakra(
    <BusinessPageListClient
      pages={pages}
      businesses={businesses}
      images={images}
      actions={actions}
    />,
  )
}

describe('BusinessPageListClient', () => {
  it('renders the heading and empty state', () => {
    renderList([])

    expect(
      screen.getByRole('heading', { name: '행사 하위 페이지' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/FAQ, 지원 안내, 동의서/)).toBeInTheDocument()
    expect(
      screen.getByText('아직 등록된 데이터가 없습니다.'),
    ).toBeInTheDocument()
  })

  it('shows icon, title, business name and the slug-relative path', () => {
    renderList([
      makeBusinessPage({ id: 1, businessId: 1, icon: '❓', title: 'FAQ' }),
      makeBusinessPage({
        id: 2,
        businessId: 1,
        icon: null,
        path: 'notice/team-building',
        title: '팀 빌딩',
      }),
    ])

    expect(screen.getByText('#1 · ❓ FAQ')).toBeInTheDocument()
    expect(
      screen.getByText('DSF 2026 · 페이지 /hackathon/dsf26/faq'),
    ).toBeInTheDocument()
    expect(screen.getByText('#2 · 팀 빌딩')).toBeInTheDocument()
    expect(
      screen.getByText(
        'DSF 2026 · 페이지 /hackathon/dsf26/notice/team-building',
      ),
    ).toBeInTheDocument()
  })

  it('flags a business without a slug and an unknown business id', () => {
    renderList([
      makeBusinessPage({ id: 3, businessId: 2, path: 'apply' }),
      makeBusinessPage({ id: 4, businessId: 99, path: 'faq' }),
    ])

    expect(
      screen.getByText('옛 행사 · 행사 슬러그가 없어 공개되지 않음(apply)'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('사업 #99 · 행사 슬러그가 없어 공개되지 않음(faq)'),
    ).toBeInTheDocument()
  })

  it('opens create and edit drawers', async () => {
    const { user } = renderList([makeBusinessPage({ id: 5, businessId: 1 })])

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '행사 하위 페이지 추가' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: '#1 DSF 2026 (dsf26)' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(
      screen.getByRole('heading', { name: '행사 하위 페이지 수정 #5' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('경로')).toHaveValue('faq')

    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '행사 하위 페이지 수정 #5' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('keeps the edit drawer open on open requests and closes it on close requests', async () => {
    const { user } = renderList([makeBusinessPage({ id: 5, businessId: 1 })])

    await user.click(screen.getByRole('button', { name: '수정' }))
    act(() => lastDrawerProps('행사 하위 페이지 수정 #5').onOpenChange(true))
    expect(
      screen.getByRole('heading', { name: '행사 하위 페이지 수정 #5' }),
    ).toBeInTheDocument()

    act(() => lastDrawerProps('행사 하위 페이지 수정 #5').onOpenChange(false))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '행사 하위 페이지 수정 #5' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('deletes a page through deleteBusinessPage with its id', async () => {
    const { user } = renderList([makeBusinessPage({ id: 6 })])

    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      '행사 페이지 삭제',
    )
    await user.click(screen.getAllByRole('button', { name: '삭제' }).at(-1)!)

    await waitFor(() =>
      expect(actions.deleteBusinessPage).toHaveBeenCalledTimes(1),
    )
    const formData = actions.deleteBusinessPage.mock.calls[0][0]
    expect(formData.get('id')).toBe('6')
  })
})

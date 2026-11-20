import { describe, expect, it, vi } from 'vitest'
import { act, renderWithChakra, screen, waitFor } from '@/tests/utils/render'
import { makeBusiness, makeImageAsset } from '@/tests/utils/fixtures'
import type { BusinessWithLinks } from './business-form'
import { BusinessListClient } from './business-list-client'
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

const actions = {
  createBusiness: vi.fn(async () => {}),
  updateBusiness: vi.fn(async () => {}),
  deleteBusiness: vi.fn(async () => {}),
}

const institutions = [{ id: 1, nameKo: '과학기술정보통신부' }]
const images = [makeImageAsset({ id: 2, filename: 'cover.png' })]

function withLinks(
  overrides: Partial<BusinessWithLinks> = {},
): BusinessWithLinks {
  return { ...makeBusiness(), institutions: [], ...overrides }
}

function renderList(businesses: BusinessWithLinks[]) {
  return renderWithChakra(
    <BusinessListClient
      businesses={businesses}
      institutions={institutions}
      images={images}
      actions={actions}
    />,
  )
}

describe('BusinessListClient', () => {
  it('renders category, code, Korean date range, location and event page path', () => {
    renderList([
      withLinks({
        id: 3,
        name: '해커톤',
        code: 'hackathon',
        slug: 'dsf26',
        category: 'ideathon',
        startDate: new Date('2026-05-01T00:00:00Z'),
        endDate: new Date('2026-05-02T00:00:00Z'),
        location: 'Seoul',
      }),
    ])

    expect(
      screen.getByRole('heading', { name: '사업(행사)' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/개최일 최신순입니다/)).toBeInTheDocument()
    expect(screen.getByText('#3 · 해커톤')).toBeInTheDocument()
    expect(
      screen.getByText(
        '아이디어톤 · 코드 hackathon · 2026년 5월 1일 ~ 2026년 5월 2일 · Seoul',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('페이지 /hackathon/dsf26')).toBeInTheDocument()
  })

  it('links conference and program events under /conference', () => {
    renderList([
      withLinks({ id: 1, category: 'conference', slug: 'dsf' }),
      withLinks({ id: 2, category: 'program', slug: 'camp' }),
    ])

    expect(screen.getByText('페이지 /conference/dsf')).toBeInTheDocument()
    expect(screen.getByText('페이지 /conference/camp')).toBeInTheDocument()
  })

  it('marks slug-less events as list-only and omits a missing location', () => {
    renderList([
      withLinks({
        id: 4,
        code: 'old',
        slug: null,
        category: 'program',
        location: null,
        startDate: new Date('2019-08-10T00:00:00Z'),
        endDate: new Date('2019-08-10T00:00:00Z'),
      }),
    ])

    expect(
      screen.getByText(
        '프로그램 · 코드 old · 2019년 8월 10일 ~ 2019년 8월 10일',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('행사 페이지 없음(목록에만 표시)'),
    ).toBeInTheDocument()
  })

  it('keeps the order it was given (newest first from the page query)', () => {
    renderList([
      withLinks({ id: 7, name: '2026 행사' }),
      withLinks({ id: 2, name: '2019 행사' }),
    ])

    const names = screen
      .getAllByText(/^#\d+ · /)
      .map((element) => element.textContent)
    expect(names).toEqual(['#7 · 2026 행사', '#2 · 2019 행사'])
  })

  it('opens create and edit business drawers with picker data', async () => {
    const { user } = renderList([
      withLinks({
        id: 3,
        institutions: [{ institutionId: 1, role: 'organizer', sortOrder: 0 }],
      }),
    ])

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '사업(행사) 추가' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: '#2 cover.png' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(
      screen.getByRole('heading', { name: '사업(행사) 수정 #3' }),
    ).toBeInTheDocument()
    expect(
      screen
        .getByRole('dialog')
        .querySelector<HTMLInputElement>('input[name="role_organizer"]'),
    ).toHaveValue('1')
    expect(
      screen.getByRole('button', { name: '주관 과학기술정보통신부 빼기' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '사업(행사) 수정 #3' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('keeps the edit drawer open on open requests and closes it on close requests', async () => {
    const { user } = renderList([withLinks({ id: 3 })])

    await user.click(screen.getByRole('button', { name: '수정' }))
    act(() => lastDrawerProps('사업(행사) 수정 #3').onOpenChange(true))
    expect(
      screen.getByRole('heading', { name: '사업(행사) 수정 #3' }),
    ).toBeInTheDocument()

    act(() => lastDrawerProps('사업(행사) 수정 #3').onOpenChange(false))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '사업(행사) 수정 #3' }),
      ).not.toBeInTheDocument(),
    )
  })
})

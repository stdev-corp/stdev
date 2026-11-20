import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, waitFor, within } from '@/tests/utils/render'
import { makeBusiness, makeImageAsset } from '@/tests/utils/fixtures'
import { BusinessFormDrawer, type BusinessWithLinks } from './business-form'

vi.mock('../toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}))

const institutions = [
  { id: 1, nameKo: '과학기술정보통신부' },
  { id: 2, nameKo: '한국과학창의재단' },
  { id: 3, nameKo: '에스티데브' },
]

const images = [
  makeImageAsset({ id: 4, filename: 'cover.png' }),
  makeImageAsset({
    id: 5,
    filename: null,
    url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/no-name.png',
  }),
]

function withLinks(
  overrides: Partial<BusinessWithLinks> = {},
): BusinessWithLinks {
  return { ...makeBusiness(), institutions: [], ...overrides }
}

function renderForm(
  business?: BusinessWithLinks,
  action = vi.fn<(formData: FormData) => Promise<void>>(async () => {}),
) {
  const result = renderWithChakra(
    <BusinessFormDrawer
      open
      onOpenChange={vi.fn()}
      business={business}
      institutions={institutions}
      images={images}
      action={action}
    />,
  )
  return { ...result, action }
}

function hiddenValue(name: string) {
  const input = screen
    .getByRole('dialog')
    .querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`)
  return input?.value
}

describe('BusinessFormDrawer', () => {
  it('renders create fields with required inputs and empty defaults', () => {
    renderForm()

    expect(
      screen.getByRole('heading', { name: '사업(행사) 추가' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toBeRequired()
    expect(screen.getByLabelText('코드')).toBeRequired()
    expect(screen.getByLabelText('분류')).toHaveValue('hackathon')
    expect(screen.getByLabelText('URL 슬러그')).toHaveValue('')
    expect(screen.getByLabelText('시작일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('시작일')).toBeRequired()
    expect(screen.getByLabelText('시작 시각')).toHaveAttribute('type', 'time')
    expect(screen.getByLabelText('시작 시각')).not.toBeRequired()
    expect(screen.getByLabelText('종료일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('')
    expect(screen.getByLabelText('장소')).toHaveValue('')
    expect(screen.getByLabelText('아이콘')).toHaveValue('')
    expect(screen.getByLabelText('커버 이미지')).toHaveValue('')
    expect(screen.getByLabelText('목록 요약')).toHaveValue('')
    expect(screen.getByLabelText('행사 페이지 본문')).toHaveValue('')
    expect(screen.getByLabelText('노션 페이지 ID')).toHaveValue('')
    expect(hiddenValue('id')).toBeUndefined()
    expect(hiddenValue('role_host')).toBe('')
    expect(screen.getAllByText('선택한 기관이 없습니다.')).toHaveLength(4)
  })

  it('lists every category and image option (filename or URL)', () => {
    renderForm()

    const category = screen.getByLabelText('분류')
    expect(
      within(category)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['해커톤', '아이디어톤', '컨퍼런스', '프로그램'])

    const cover = screen.getByLabelText('커버 이미지')
    expect(
      within(cover)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      '커버 없음',
      '#4 cover.png',
      '#5 https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/no-name.png',
    ])
  })

  it('renders date-only edit defaults from the stored UTC date', () => {
    renderForm(
      withLinks({
        id: 5,
        name: '컨퍼런스',
        code: 'conf',
        slug: 'conf26',
        category: 'conference',
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: new Date('2026-03-02T00:00:00Z'),
        hasTime: false,
        location: 'Busan',
        icon: '🌸',
        coverImageId: 4,
        summary: '요약',
        content: '# 본문',
        notionId: '1b83ff07-ff5b-8051-810e-ea2915cdc850',
      }),
    )

    expect(
      screen.getByRole('heading', { name: '사업(행사) 수정 #5' }),
    ).toBeInTheDocument()
    expect(hiddenValue('id')).toBe('5')
    expect(screen.getByLabelText('이름')).toHaveValue('컨퍼런스')
    expect(screen.getByLabelText('코드')).toHaveValue('conf')
    expect(screen.getByLabelText('분류')).toHaveValue('conference')
    expect(screen.getByLabelText('URL 슬러그')).toHaveValue('conf26')
    expect(screen.getByLabelText('시작일')).toHaveValue('2026-03-01')
    expect(screen.getByLabelText('시작 시각')).toHaveValue('')
    expect(screen.getByLabelText('종료일')).toHaveValue('2026-03-02')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('')
    expect(screen.getByLabelText('장소')).toHaveValue('Busan')
    expect(screen.getByLabelText('아이콘')).toHaveValue('🌸')
    expect(screen.getByLabelText('커버 이미지')).toHaveValue('4')
    expect(screen.getByLabelText('목록 요약')).toHaveValue('요약')
    expect(screen.getByLabelText('행사 페이지 본문')).toHaveValue('# 본문')
    expect(screen.getByLabelText('노션 페이지 ID')).toHaveValue(
      '1b83ff07-ff5b-8051-810e-ea2915cdc850',
    )
  })

  it('shows stored instants as Korean local date and time when hasTime is set', () => {
    renderForm(
      withLinks({
        // 2026-02-23 14:00 KST ~ 2026-02-24 19:00 KST
        startDate: new Date('2026-02-23T05:00:00Z'),
        endDate: new Date('2026-02-24T10:00:00Z'),
        hasTime: true,
      }),
    )

    expect(screen.getByLabelText('시작일')).toHaveValue('2026-02-23')
    expect(screen.getByLabelText('시작 시각')).toHaveValue('14:00')
    expect(screen.getByLabelText('종료일')).toHaveValue('2026-02-24')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('19:00')
  })

  it('preloads institution links per role in their saved sort order', () => {
    renderForm(
      withLinks({
        institutions: [
          { institutionId: 1, role: 'host', sortOrder: 1 },
          { institutionId: 3, role: 'host', sortOrder: 0 },
          { institutionId: 2, role: 'sponsor', sortOrder: 0 },
        ],
      }),
    )

    expect(hiddenValue('role_host')).toBe('3,1')
    expect(hiddenValue('role_organizer')).toBe('')
    expect(hiddenValue('role_sponsor')).toBe('2')
    expect(hiddenValue('role_partner')).toBe('')
    expect(
      screen.getByRole('button', { name: '주최 에스티데브 위로' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '주최 과학기술정보통신부 아래로' }),
    ).toBeDisabled()
  })

  it('submits the edited values, including picked institutions, to the action', async () => {
    const { user, action } = renderForm(
      withLinks({
        id: 9,
        institutions: [{ institutionId: 1, role: 'host', sortOrder: 0 }],
      }),
    )

    await user.selectOptions(screen.getByLabelText('분류'), 'program')
    await user.type(screen.getByLabelText('시작 시각'), '09:30')
    await user.selectOptions(
      screen.getByRole('combobox', { name: '주최 기관 추가' }),
      '3',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: '후원 기관 추가' }),
      '2',
    )
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    const formData = action.mock.calls[0][0]
    expect(formData.get('id')).toBe('9')
    expect(formData.get('category')).toBe('program')
    expect(formData.get('startTime')).toBe('09:30')
    expect(formData.get('role_host')).toBe('1,3')
    expect(formData.get('role_sponsor')).toBe('2')
    expect(formData.get('role_partner')).toBe('')
    expect(formData.get('content')).toBe('')
  })
})

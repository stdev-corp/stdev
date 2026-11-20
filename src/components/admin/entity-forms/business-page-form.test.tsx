import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, waitFor, within } from '@/tests/utils/render'
import { makeBusinessPage, makeImageAsset } from '@/tests/utils/fixtures'
import { BusinessPageFormDrawer } from './business-page-form'

vi.mock('../toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}))

const businesses = [
  { id: 1, name: 'DSF 2026', slug: 'dsf26' },
  { id: 2, name: '옛 행사', slug: null },
]

const images = [
  makeImageAsset({ id: 4, filename: 'faq-cover.png' }),
  makeImageAsset({
    id: 5,
    filename: null,
    url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/x.png',
  }),
]

function renderForm(
  page?: ReturnType<typeof makeBusinessPage>,
  action = vi.fn<(formData: FormData) => Promise<void>>(async () => {}),
) {
  const result = renderWithChakra(
    <BusinessPageFormDrawer
      open
      onOpenChange={vi.fn()}
      page={page}
      businesses={businesses}
      images={images}
      action={action}
    />,
  )
  return { ...result, action }
}

describe('BusinessPageFormDrawer', () => {
  it('renders empty create fields with business and image options', () => {
    renderForm()

    expect(
      screen.getByRole('heading', { name: '행사 하위 페이지 추가' }),
    ).toBeInTheDocument()
    const businessSelect = screen.getByLabelText('행사')
    expect(businessSelect).toHaveValue('')
    expect(
      within(businessSelect)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['행사 선택', '#1 DSF 2026 (dsf26)', '#2 옛 행사 (슬러그 없음)'])
    expect(screen.getByLabelText('경로')).toBeRequired()
    expect(screen.getByLabelText('경로')).toHaveValue('')
    expect(screen.getByLabelText('제목')).toBeRequired()
    expect(screen.getByLabelText('아이콘')).toHaveValue('')
    expect(
      within(screen.getByLabelText('커버 이미지'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      '커버 없음',
      '#4 faq-cover.png',
      '#5 https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/x.png',
    ])
    expect(screen.getByLabelText('본문')).toHaveValue('')
    expect(screen.getByLabelText('노션 페이지 ID')).toHaveValue('')
    expect(
      screen.getByRole('dialog').querySelector('input[name="id"]'),
    ).toBeNull()
  })

  it('renders edit defaults from the page', () => {
    renderForm(
      makeBusinessPage({
        id: 8,
        businessId: 2,
        path: 'notice/team-building',
        title: '팀 빌딩 안내',
        icon: '📢',
        coverImageId: 5,
        content: '## 안내',
        notionId: '17e3ff07-ff5b-81cb-9285-c5a141c41055',
      }),
    )

    expect(
      screen.getByRole('heading', { name: '행사 하위 페이지 수정 #8' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('dialog').querySelector('input[name="id"]'),
    ).toHaveValue('8')
    expect(screen.getByLabelText('행사')).toHaveValue('2')
    expect(screen.getByLabelText('경로')).toHaveValue('notice/team-building')
    expect(screen.getByLabelText('제목')).toHaveValue('팀 빌딩 안내')
    expect(screen.getByLabelText('아이콘')).toHaveValue('📢')
    expect(screen.getByLabelText('커버 이미지')).toHaveValue('5')
    expect(screen.getByLabelText('본문')).toHaveValue('## 안내')
    expect(screen.getByLabelText('노션 페이지 ID')).toHaveValue(
      '17e3ff07-ff5b-81cb-9285-c5a141c41055',
    )
  })

  it('falls back to empty values for nullable fields when editing', () => {
    renderForm(makeBusinessPage({ icon: null, notionId: null }))

    expect(screen.getByLabelText('아이콘')).toHaveValue('')
    expect(screen.getByLabelText('커버 이미지')).toHaveValue('')
    expect(screen.getByLabelText('노션 페이지 ID')).toHaveValue('')
  })

  it('submits the entered values to the action', async () => {
    const { user, action } = renderForm()

    await user.selectOptions(screen.getByLabelText('행사'), '1')
    await user.type(screen.getByLabelText('경로'), 'faq')
    await user.type(screen.getByLabelText('제목'), '자주 묻는 질문')
    await user.type(screen.getByLabelText('본문'), '질문과 답')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    const formData = action.mock.calls[0][0]
    expect(formData.get('businessId')).toBe('1')
    expect(formData.get('path')).toBe('faq')
    expect(formData.get('title')).toBe('자주 묻는 질문')
    expect(formData.get('content')).toBe('질문과 답')
    expect(formData.get('coverImageId')).toBe('')
    expect(formData.has('id')).toBe(false)
  })
})

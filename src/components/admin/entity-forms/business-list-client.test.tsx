import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { makeBusiness } from '@/tests/utils/fixtures'
import { BusinessListClient } from './business-list-client'

const actions = {
  createBusiness: vi.fn(async () => {}),
  updateBusiness: vi.fn(async () => {}),
  deleteBusiness: vi.fn(async () => {}),
}

describe('BusinessListClient', () => {
  it('renders business metadata and Korean date range', () => {
    renderWithChakra(
      <BusinessListClient
        businesses={[
          makeBusiness({
            id: 3,
            name: '해커톤',
            code: 'hackathon',
            startDate: new Date('2026-05-01T00:00:00Z'),
            endDate: new Date('2026-05-02T00:00:00Z'),
            location: 'Seoul',
          }),
        ]}
        actions={actions}
      />,
    )

    expect(screen.getByRole('heading', { name: '사업' })).toBeInTheDocument()
    expect(screen.getByText('#3 · 해커톤')).toBeInTheDocument()
    expect(
      screen.getByText(
        '코드 hackathon · 2026년 5월 1일 ~ 2026년 5월 2일 · Seoul',
      ),
    ).toBeInTheDocument()
  })

  it('opens create and edit business drawers', async () => {
    const { user } = renderWithChakra(
      <BusinessListClient
        businesses={[makeBusiness({ id: 3 })]}
        actions={actions}
      />,
    )

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '사업 추가' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(
      screen.getByRole('heading', { name: '사업 수정 #3' }),
    ).toBeInTheDocument()
  })
})

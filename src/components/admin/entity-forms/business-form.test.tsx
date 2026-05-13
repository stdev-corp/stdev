import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { makeBusiness } from '@/tests/utils/fixtures'
import { BusinessFormDrawer } from './business-form'

describe('BusinessFormDrawer', () => {
  it('renders create fields with required business inputs', () => {
    renderWithChakra(
      <BusinessFormDrawer
        open
        onOpenChange={vi.fn()}
        action={vi.fn(async () => {})}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '사업 추가' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toBeRequired()
    expect(screen.getByLabelText('코드')).toBeRequired()
    expect(screen.getByLabelText('시작일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('종료일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('장소')).toHaveValue('')
  })

  it('renders edit defaults using admin date values', () => {
    const business = makeBusiness({
      id: 5,
      name: '컨퍼런스',
      code: 'conf',
      startDate: new Date('2026-03-01T12:00:00Z'),
      endDate: new Date('2026-03-02T12:00:00Z'),
      location: 'Busan',
    })

    renderWithChakra(
      <BusinessFormDrawer
        open
        onOpenChange={vi.fn()}
        business={business}
        action={vi.fn(async () => {})}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '사업 수정 #5' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toHaveValue('컨퍼런스')
    expect(screen.getByLabelText('코드')).toHaveValue('conf')
    expect(screen.getByLabelText('시작일')).toHaveValue('2026-03-01')
    expect(screen.getByLabelText('종료일')).toHaveValue('2026-03-02')
    expect(screen.getByLabelText('장소')).toHaveValue('Busan')
  })
})

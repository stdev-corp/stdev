import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { SettingFormDrawer, type AdminSettingSummary } from './setting-form'

const setting: AdminSettingSummary = {
  id: 1,
  key: 'AWS_SECRET_ACCESS_KEY',
  hasValue: true,
  valueLength: 24,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
}

describe('SettingFormDrawer', () => {
  it('renders create mode without exposing a stored value', () => {
    renderWithChakra(
      <SettingFormDrawer
        open
        onOpenChange={vi.fn()}
        action={vi.fn(async () => {})}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '설정 추가' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('키')).toHaveValue('')
    expect(screen.getByLabelText('값')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('값')).toBeRequired()
  })

  it('renders edit mode with key metadata but without the secret value', () => {
    renderWithChakra(
      <SettingFormDrawer
        open
        onOpenChange={vi.fn()}
        setting={setting}
        action={vi.fn(async () => {})}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '설정 수정: AWS_SECRET_ACCESS_KEY' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('키')).toHaveValue('AWS_SECRET_ACCESS_KEY')
    expect(screen.getByLabelText('키')).toBeDisabled()
    expect(screen.getByLabelText('값')).toHaveValue('')
    expect(screen.getByLabelText('값')).not.toBeRequired()
    expect(screen.queryByDisplayValue('secret')).not.toBeInTheDocument()
  })
})

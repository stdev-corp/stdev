import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, waitFor } from '@/tests/utils/render'
import { SettingListClient } from './setting-list-client'
import type { AdminSettingSummary } from './setting-form'

const settings: AdminSettingSummary[] = [
  {
    id: 1,
    key: 'AWS_ACCESS_KEY_ID',
    hasValue: true,
    valueLength: 20,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  },
  {
    id: 2,
    key: 'EMPTY_SETTING',
    hasValue: false,
    valueLength: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  },
]

const actions = {
  createAdminSetting: vi.fn(async () => {}),
  updateAdminSetting: vi.fn(async () => {}),
  deleteAdminSetting: vi.fn(async () => {}),
}

describe('SettingListClient', () => {
  it('renders masked settings without secret values', () => {
    renderWithChakra(
      <SettingListClient settings={settings} actions={actions} />,
    )

    expect(screen.getByRole('heading', { name: '설정' })).toBeInTheDocument()
    expect(screen.getByText('AWS_ACCESS_KEY_ID')).toBeInTheDocument()
    expect(screen.getByText('값: ••••••••••••')).toBeInTheDocument()
    expect(screen.getByText('EMPTY_SETTING')).toBeInTheDocument()
    expect(screen.getByText('값: (빈 값)')).toBeInTheDocument()
    expect(screen.queryByText('AKIA1234567890')).not.toBeInTheDocument()
    expect(screen.queryByText('actual-secret-value')).not.toBeInTheDocument()
  })

  it('opens create and edit setting drawers', async () => {
    const { user } = renderWithChakra(
      <SettingListClient settings={settings} actions={actions} />,
    )

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '설정 추가' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    expect(
      screen.getByRole('heading', { name: '설정 수정: AWS_ACCESS_KEY_ID' }),
    ).toBeInTheDocument()
  })

  it('keeps page interactive after closing a drawer so the next open succeeds', async () => {
    const { user } = renderWithChakra(
      <SettingListClient settings={settings} actions={actions} />,
    )

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '설정 추가' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '설정 추가' }),
      ).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '설정 추가' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '설정 추가' }),
      ).not.toBeInTheDocument(),
    )

    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    expect(
      screen.getByRole('heading', { name: '설정 수정: AWS_ACCESS_KEY_ID' }),
    ).toBeInTheDocument()
  })

  it('refreshes form values when switching edit target after exit', async () => {
    const { user } = renderWithChakra(
      <SettingListClient settings={settings} actions={actions} />,
    )

    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    expect(
      screen.getByRole('heading', { name: '설정 수정: AWS_ACCESS_KEY_ID' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', {
          name: '설정 수정: AWS_ACCESS_KEY_ID',
        }),
      ).not.toBeInTheDocument(),
    )

    await user.click(screen.getAllByRole('button', { name: '수정' })[1])
    expect(
      screen.getByRole('heading', { name: '설정 수정: EMPTY_SETTING' }),
    ).toBeInTheDocument()
  })
})

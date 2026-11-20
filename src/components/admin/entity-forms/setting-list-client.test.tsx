import { describe, expect, it, vi } from 'vitest'
import { act, renderWithChakra, screen, waitFor } from '@/tests/utils/render'
import { SettingListClient } from './setting-list-client'
import type { AdminSettingSummary } from './setting-form'
import { FormDrawer } from '../form-drawer'

// 실제 드로어를 그대로 그리되, 받은 props를 꺼내 쓸 수 있게 감싼다.
vi.mock('../form-drawer', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../form-drawer')>()
  return { ...mod, FormDrawer: vi.fn(mod.FormDrawer) }
})

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
    expect(screen.getByLabelText('키')).toHaveValue('AWS_ACCESS_KEY_ID')

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
    expect(screen.getByLabelText('키')).toHaveValue('EMPTY_SETTING')
  })

  it('reopens the create drawer after a successful submit and revalidation', async () => {
    const createAdminSetting = vi.fn(async () => {})
    const { user, rerender } = renderWithChakra(
      <SettingListClient
        settings={settings}
        actions={{ ...actions, createAdminSetting }}
      />,
    )

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '설정 추가' }),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('키'), 'NEW_KEY')
    await user.type(screen.getByLabelText('값'), 'new-value')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(createAdminSetting).toHaveBeenCalledTimes(1))

    const nextSettings: AdminSettingSummary[] = [
      ...settings,
      {
        id: 3,
        key: 'NEW_KEY',
        hasValue: true,
        valueLength: 9,
        createdAt: new Date('2026-02-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      },
    ]
    rerender(
      <SettingListClient
        settings={nextSettings}
        actions={{ ...actions, createAdminSetting }}
      />,
    )

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '설정 추가' }),
      ).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '설정 추가' }),
    ).toBeInTheDocument()
  })

  it('keeps the edit drawer open on open requests and closes it on close requests', async () => {
    const title = '설정 수정: AWS_ACCESS_KEY_ID'
    const lastDrawerProps = () =>
      vi
        .mocked(FormDrawer)
        .mock.calls.map(([props]) => props)
        .findLast((props) => props.title === title)!
    const { user } = renderWithChakra(
      <SettingListClient settings={settings} actions={actions} />,
    )

    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    act(() => lastDrawerProps().onOpenChange(true))
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()

    act(() => lastDrawerProps().onOpenChange(false))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: title }),
      ).not.toBeInTheDocument(),
    )
  })
})

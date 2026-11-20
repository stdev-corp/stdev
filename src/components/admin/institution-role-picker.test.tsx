import { describe, expect, it } from 'vitest'
import {
  fireEvent,
  renderWithChakra,
  screen,
  within,
} from '@/tests/utils/render'
import type { BusinessRole } from '@/utils/cms-types'
import { InstitutionRolePicker } from './institution-role-picker'

const institutions = [
  { id: 1, nameKo: '과학기술정보통신부' },
  { id: 2, nameKo: '한국과학창의재단' },
  { id: 3, nameKo: '에스티데브' },
]

const empty: Record<BusinessRole, number[]> = {
  host: [],
  organizer: [],
  sponsor: [],
  partner: [],
}

function renderPicker(
  defaultValue: Partial<Record<BusinessRole, number[]>> = {},
) {
  return renderWithChakra(
    <InstitutionRolePicker
      institutions={institutions}
      defaultValue={{ ...empty, ...defaultValue }}
    />,
  )
}

function hidden(container: HTMLElement, role: BusinessRole) {
  return container.querySelector<HTMLInputElement>(
    `input[type="hidden"][name="role_${role}"]`,
  )!.value
}

function optionNames(select: HTMLElement) {
  return within(select)
    .getAllByRole('option')
    .map((option) => option.textContent)
}

describe('InstitutionRolePicker', () => {
  it('renders the four roles in order with empty hidden inputs', () => {
    const { container } = renderPicker()

    expect(
      screen
        .getAllByRole('combobox')
        .map((select) => select.getAttribute('aria-label')),
    ).toEqual([
      '주최 기관 추가',
      '주관 기관 추가',
      '후원 기관 추가',
      '협력 기관 추가',
    ])
    expect(screen.getAllByText('선택한 기관이 없습니다.')).toHaveLength(4)
    for (const role of ['host', 'organizer', 'sponsor', 'partner'] as const) {
      expect(hidden(container, role)).toBe('')
    }
    expect(
      optionNames(screen.getByRole('combobox', { name: '주최 기관 추가' })),
    ).toEqual([
      '주최 기관 추가…',
      '과학기술정보통신부',
      '한국과학창의재단',
      '에스티데브',
    ])
  })

  it('shows default links in order and falls back to #id for unknown institutions', () => {
    const { container } = renderPicker({ host: [3, 1], partner: [99] })

    expect(hidden(container, 'host')).toBe('3,1')
    expect(hidden(container, 'partner')).toBe('99')
    expect(screen.getByText('#99')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '협력 #99 빼기' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('선택한 기관이 없습니다.')).toHaveLength(2)
  })

  it('adds an institution via the select and removes it from that role options', async () => {
    const { container, user } = renderPicker({ host: [1] })

    const hostSelect = screen.getByRole('combobox', { name: '주최 기관 추가' })
    expect(optionNames(hostSelect)).not.toContain('과학기술정보통신부')

    await user.selectOptions(hostSelect, '2')

    expect(hidden(container, 'host')).toBe('1,2')
    expect(hostSelect).toHaveValue('')
    expect(optionNames(hostSelect)).toEqual(['주최 기관 추가…', '에스티데브'])
    // 다른 역할에는 여전히 고를 수 있다.
    expect(
      optionNames(screen.getByRole('combobox', { name: '후원 기관 추가' })),
    ).toContain('한국과학창의재단')
    expect(hidden(container, 'sponsor')).toBe('')
  })

  it('ignores picking the placeholder option', () => {
    const { container } = renderPicker({ sponsor: [3] })

    fireEvent.change(screen.getByRole('combobox', { name: '후원 기관 추가' }), {
      target: { value: '' },
    })

    expect(hidden(container, 'sponsor')).toBe('3')
  })

  it('reorders institutions with the up and down buttons', async () => {
    const { container, user } = renderPicker({ organizer: [1, 2, 3] })

    const upFirst = screen.getByRole('button', {
      name: '주관 과학기술정보통신부 위로',
    })
    const downLast = screen.getByRole('button', {
      name: '주관 에스티데브 아래로',
    })
    expect(upFirst).toBeDisabled()
    expect(downLast).toBeDisabled()

    await user.click(
      screen.getByRole('button', { name: '주관 에스티데브 위로' }),
    )
    expect(hidden(container, 'organizer')).toBe('1,3,2')

    await user.click(
      screen.getByRole('button', { name: '주관 과학기술정보통신부 아래로' }),
    )
    expect(hidden(container, 'organizer')).toBe('3,1,2')

    const badges = within(container)
      .getAllByText(/^[123]$/)
      .map((badge) => badge.textContent)
    expect(badges).toEqual(['1', '2', '3'])
    expect(
      screen.getByRole('button', { name: '주관 에스티데브 위로' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '주관 한국과학창의재단 아래로' }),
    ).toBeDisabled()
  })

  it('removes an institution and makes it selectable again', async () => {
    const { container, user } = renderPicker({ host: [1, 2] })

    await user.click(
      screen.getByRole('button', { name: '주최 과학기술정보통신부 빼기' }),
    )

    expect(hidden(container, 'host')).toBe('2')
    expect(
      optionNames(screen.getByRole('combobox', { name: '주최 기관 추가' })),
    ).toContain('과학기술정보통신부')

    await user.click(
      screen.getByRole('button', { name: '주최 한국과학창의재단 빼기' }),
    )
    expect(hidden(container, 'host')).toBe('')
    expect(screen.getAllByText('선택한 기관이 없습니다.')).toHaveLength(4)
  })

  it('keeps each role independent when editing', async () => {
    const { container, user } = renderPicker({ host: [1], sponsor: [1] })

    await user.click(
      screen.getByRole('button', { name: '후원 과학기술정보통신부 빼기' }),
    )

    expect(hidden(container, 'host')).toBe('1')
    expect(hidden(container, 'sponsor')).toBe('')
  })
})

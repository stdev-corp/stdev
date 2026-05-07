import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { AdminActionButtons } from '@/components/admin/action-buttons'

describe('<AdminActionButtons>', () => {
  it('renders a submit button labeled "수정"', () => {
    const deleteAction = vi.fn(async () => {})
    renderWithChakra(<AdminActionButtons deleteAction={deleteAction} />)
    const submit = screen.getByRole('button', { name: '수정' })
    expect(submit).toHaveAttribute('type', 'submit')
  })

  it('renders a delete button labeled "삭제"', () => {
    const deleteAction = vi.fn(async () => {})
    renderWithChakra(<AdminActionButtons deleteAction={deleteAction} />)
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('renders exactly two buttons', () => {
    const deleteAction = vi.fn(async () => {})
    renderWithChakra(<AdminActionButtons deleteAction={deleteAction} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('wires the delete button with a formAction handler', async () => {
    const deleteAction = vi.fn(async () => {})
    const { user } = renderWithChakra(
      <form>
        <AdminActionButtons deleteAction={deleteAction} />
      </form>,
    )
    const del = screen.getByRole('button', {
      name: '삭제',
    }) as HTMLButtonElement
    expect(del.type).toBe('submit')
    await user.click(del)
  })
})

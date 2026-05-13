import { describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { DeleteAlertDialog } from './delete-alert-dialog'
import { toaster } from './toaster'

vi.mock('./toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}))

describe('DeleteAlertDialog', () => {
  it('opens and closes a destructive confirmation dialog', async () => {
    const action = vi.fn(async () => {})
    const { user } = renderWithChakra(
      <DeleteAlertDialog action={action} recordId={7} label="사업" />,
    )

    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '사업 삭제' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(action).not.toHaveBeenCalled()
  })

  it('submits record id through FormData and shows success toast', async () => {
    const action = vi.fn(async () => {})
    const { user } = renderWithChakra(
      <DeleteAlertDialog action={action} recordId={42} label="설정" />,
    )

    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(screen.getAllByRole('button', { name: '삭제' }).at(-1)!)

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    const formData = action.mock.calls[0][0] as FormData
    expect(formData.get('id')).toBe('42')
    expect(toaster.create).toHaveBeenCalledWith({
      title: '설정 항목을 삭제했습니다.',
      type: 'success',
    })
  })

  it('keeps the dialog open and shows error toast when deletion fails', async () => {
    const action = vi.fn(async () => {
      throw new Error('cannot delete')
    })
    const { user } = renderWithChakra(
      <DeleteAlertDialog action={action} recordId={1} label="파일" />,
    )

    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(screen.getAllByRole('button', { name: '삭제' }).at(-1)!)

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith({
        title: '삭제 실패',
        description: 'cannot delete',
        type: 'error',
      })
    })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('stringifies non-Error delete failures', async () => {
    const action = vi.fn(async () => {
      throw 'delete failed'
    })
    const { user } = renderWithChakra(
      <DeleteAlertDialog
        action={action}
        recordId={2}
        label="사업"
        description="삭제 확인"
      />,
    )

    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(screen.getByText('삭제 확인')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '삭제' }).at(-1)!)

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith({
        title: '삭제 실패',
        description: 'delete failed',
        type: 'error',
      })
    })
  })
})

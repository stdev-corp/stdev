import { describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { Input } from '@chakra-ui/react'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { FormDrawer } from './form-drawer'
import { toaster } from './toaster'

vi.mock('./toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}))

describe('FormDrawer', () => {
  it('renders drawer content and closes from cancel button', async () => {
    const onOpenChange = vi.fn()
    const { user } = renderWithChakra(
      <FormDrawer
        open
        onOpenChange={onOpenChange}
        title="사업 추가"
        action={vi.fn(async () => {})}
      >
        <Input name="name" aria-label="이름" />
      </FormDrawer>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '사업 추가' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('submits FormData, shows success toast, and closes drawer', async () => {
    const action = vi.fn(async () => {})
    const onOpenChange = vi.fn()
    const { user } = renderWithChakra(
      <FormDrawer
        open
        onOpenChange={onOpenChange}
        title="설정 추가"
        action={action}
        successMessage="완료"
      >
        <Input name="key" aria-label="키" defaultValue="AWS_ACCESS_KEY_ID" />
      </FormDrawer>,
    )

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    const formData = action.mock.calls[0][0] as FormData
    expect(formData.get('key')).toBe('AWS_ACCESS_KEY_ID')
    expect(toaster.create).toHaveBeenCalledWith({
      title: '완료',
      type: 'success',
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows an error toast and does not close when action rejects', async () => {
    const action = vi.fn(async () => {
      throw new Error('저장할 수 없습니다')
    })
    const onOpenChange = vi.fn()
    const { user } = renderWithChakra(
      <FormDrawer
        open
        onOpenChange={onOpenChange}
        title="설정 추가"
        action={action}
      >
        <Input name="key" aria-label="키" defaultValue="AWS_ACCESS_KEY_ID" />
      </FormDrawer>,
    )

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith({
        title: '저장 실패',
        description: '저장할 수 없습니다',
        type: 'error',
      })
    })
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('uses the default success message when no custom message is provided', async () => {
    const action = vi.fn(async () => {})
    const { user } = renderWithChakra(
      <FormDrawer open onOpenChange={vi.fn()} title="저장" action={action}>
        <Input name="name" aria-label="이름" defaultValue="테스트" />
      </FormDrawer>,
    )

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith({
        title: '저장되었습니다.',
        type: 'success',
      })
    })
  })

  it('stringifies non-Error failures in the error toast', async () => {
    const action = vi.fn(async () => {
      throw 'plain failure'
    })
    const { user } = renderWithChakra(
      <FormDrawer open onOpenChange={vi.fn()} title="저장" action={action}>
        <Input name="name" aria-label="이름" defaultValue="테스트" />
      </FormDrawer>,
    )

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith({
        title: '저장 실패',
        description: 'plain failure',
        type: 'error',
      })
    })
  })
})

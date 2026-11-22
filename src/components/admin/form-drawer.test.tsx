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

function drawerMaxWidth(element: HTMLElement) {
  const emotionClasses = [...element.classList].filter((name) =>
    name.startsWith('css-'),
  )
  const widths = Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules))
    .filter((rule) =>
      emotionClasses.some((name) => rule.cssText.includes(`.${name}`)),
    )
    .map((rule) => /max-width: ([^;]+);/.exec(rule.cssText)?.[1])
    .filter(Boolean)
  return widths.at(-1)
}

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

  it('저장에 실패하면 입력한 값을 그대로 남긴다', async () => {
    const onOpenChange = vi.fn()
    const action = vi.fn(async () => {
      throw new Error('슬러그는 영문 소문자만 쓸 수 있습니다.')
    })
    const { user } = renderWithChakra(
      <FormDrawer
        open
        onOpenChange={onOpenChange}
        title="사업 추가"
        action={action}
      >
        <Input name="name" aria-label="이름" defaultValue="" />
      </FormDrawer>,
    )

    await user.type(screen.getByLabelText('이름'), '새 행사')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: '저장 실패', type: 'error' }),
      ),
    )
    expect(action).toHaveBeenCalledTimes(1)
    const submitted = (action.mock.calls[0] as unknown as [FormData])[0]
    expect(submitted.get('name')).toBe('새 행사')
    expect(screen.getByLabelText('이름')).toHaveValue('새 행사')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it.each([
    ['md (default)', undefined, 'var(--chakra-sizes-lg)'],
    ['lg', 'lg', 'var(--chakra-sizes-2xl)'],
    ['xl for wide content forms', 'xl', 'var(--chakra-sizes-4xl)'],
  ] as const)('renders the drawer at size %s', (_label, size, maxWidth) => {
    renderWithChakra(
      <FormDrawer
        open
        onOpenChange={vi.fn()}
        title="크기"
        action={vi.fn(async () => {})}
        size={size}
      >
        <Input name="name" aria-label="이름" />
      </FormDrawer>,
    )

    // jsdom 30은 Chakra의 @layer 규칙을 계산 스타일에 반영하지 않으므로
    // 드로어 본문 클래스에 붙은 Emotion 규칙에서 max-width를 직접 읽는다.
    const dialog = screen.getByRole('dialog')
    expect(drawerMaxWidth(dialog)).toBe(maxWidth)
  })

  it('reports close requests from the header close button', async () => {
    const onOpenChange = vi.fn()
    const { user } = renderWithChakra(
      <FormDrawer
        open
        onOpenChange={onOpenChange}
        title="닫기"
        action={vi.fn(async () => {})}
      >
        <Input name="name" aria-label="이름" />
      </FormDrawer>,
    )

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('submits FormData, shows success toast, and closes drawer', async () => {
    const action = vi.fn<(formData: FormData) => Promise<void>>(async () => {})
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
    const formData = action.mock.calls[0][0]
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
    const action = vi.fn<(formData: FormData) => Promise<void>>(async () => {})
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

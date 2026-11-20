import { describe, expect, it } from 'vitest'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import { NotionContentField } from './notion-content-field'

function renderField(
  props: Partial<Parameters<typeof NotionContentField>[0]> = {},
) {
  return renderWithChakra(
    <form aria-label="폼">
      <NotionContentField
        name="content"
        label="행사 페이지 본문"
        defaultValue={'# 행사 소개\n\n**굵게** 본문'}
        {...props}
      />
    </form>,
  )
}

describe('NotionContentField', () => {
  it('starts in edit mode with the default value and the given name', () => {
    renderField()

    const textarea = screen.getByLabelText('행사 페이지 본문')
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea).toHaveAttribute('name', 'content')
    expect(textarea).toHaveValue('# 행사 소개\n\n**굵게** 본문')
    expect(textarea).toHaveAttribute('rows', '18')
    expect(textarea).toBeVisible()
    expect(screen.queryByTestId('content-preview')).not.toBeInTheDocument()
  })

  it('passes rows and required through to the textarea', () => {
    renderField({ rows: 6, required: true })

    const textarea = screen.getByLabelText(/행사 페이지 본문/)
    expect(textarea).toHaveAttribute('rows', '6')
    expect(textarea).toBeRequired()
  })

  it('renders the Notion preview with the public renderer and hides the textarea', async () => {
    const { user } = renderField()

    await user.click(screen.getByRole('button', { name: '미리보기' }))

    const preview = screen.getByTestId('content-preview')
    // 노션 제목 1은 페이지 h1 아래로 한 단계 내려 h2로 그린다.
    expect(
      within(preview).getByRole('heading', { level: 2, name: '행사 소개' }),
    ).toHaveClass('notion-h1')
    expect(within(preview).getByText('굵게').tagName).toBe('STRONG')
    expect(preview.querySelector('.notion-page')).toHaveStyle({
      '--notion-font-size': '16px',
    })
    expect(screen.getByLabelText('행사 페이지 본문')).not.toBeVisible()
  })

  it('previews what was typed and keeps the value for form submission', async () => {
    const { user } = renderField({ defaultValue: '' })

    const textarea = screen.getByLabelText('행사 페이지 본문')
    await user.type(textarea, '## 일정')
    await user.click(screen.getByRole('button', { name: '미리보기' }))

    expect(
      within(screen.getByTestId('content-preview')).getByRole('heading', {
        level: 3,
        name: '일정',
      }),
    ).toBeInTheDocument()

    // 미리보기 중에도 숨은 textarea가 폼 값으로 남아 있어야 저장된다.
    const formData = new FormData(
      screen.getByRole('form', { name: '폼' }) as HTMLFormElement,
    )
    expect(formData.get('content')).toBe('## 일정')
  })

  it('switches back to edit mode', async () => {
    const { user } = renderField()

    await user.click(screen.getByRole('button', { name: '미리보기' }))
    await user.click(screen.getByRole('button', { name: '편집' }))

    expect(screen.queryByTestId('content-preview')).not.toBeInTheDocument()
    expect(screen.getByLabelText('행사 페이지 본문')).toBeVisible()
  })

  it('toggles the Notion syntax help', async () => {
    const { user } = renderField()

    expect(screen.queryByText('콜아웃')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '문법 보기' }))

    expect(
      screen.getByText('마크다운(GFM)에 아래 노션 블록 문법을 더해 씁니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('콜아웃')).toBeInTheDocument()
    expect(screen.getByText('토글')).toBeInTheDocument()
    expect(screen.getByText(/:::toggle\[질문\]/)).toBeInTheDocument()
    expect(screen.getByText(/^색상: default, gray/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '문법 닫기' }))
    expect(screen.queryByText('콜아웃')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '문법 보기' }),
    ).toBeInTheDocument()
  })
})

import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, renderWithChakra, screen, within } from '@/tests/utils/render'
import type { NotionPageLinks } from '@/utils/cms-types'
import {
  NotionContentField,
  type PreviewPageLinks,
} from './notion-content-field'

function renderField(
  props: Partial<Parameters<typeof NotionContentField>[0]> = {},
  formControls?: ReactNode,
) {
  return renderWithChakra(
    <form aria-label="폼">
      {formControls}
      <NotionContentField
        name="content"
        label="행사 페이지 본문"
        defaultValue={'# 행사 소개\n\n**굵게** 본문'}
        {...props}
      />
    </form>,
  )
}

// 같은 행사의 'schedule'과 다른 행사(dsf26)의 'faq'를 가리키는 본문
const PAGE_LINK_CONTENT =
  '# 행사 소개\n\n::page{path="schedule"}\n\n::page{event="dsf26" path="faq"}'

const SCHEDULE_LINK: NotionPageLinks = {
  ':schedule': {
    href: '/hackathon/dsf25/schedule',
    title: '세부 일정',
    icon: '🗓️',
  },
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const LOADING = '하위 페이지 링크를 불러오는 중…'

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

  it('문법 도움말에 새 노션 블록 문법을 보여 주고 옛 제목은 없앤다', async () => {
    const { user } = renderField()

    await user.click(screen.getByRole('button', { name: '문법 보기' }))

    for (const title of [
      '글자 꾸미기',
      '색 블록',
      '들여쓰기',
      '표 머리글·열 폭',
      '데이터베이스 표',
      '갤러리(카드 목록)',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    expect(screen.queryByText('글자 색')).not.toBeInTheDocument()
    expect(screen.queryByText('표 머리글')).not.toBeInTheDocument()

    expect(screen.getByText(/:b\[굵게\] \/ :i\[기울임\]/)).toBeVisible()
    expect(screen.getByText(/:::color\{c="gray_background"\}/)).toBeVisible()
    expect(screen.getByText(/:::indent/)).toBeVisible()
    expect(screen.getByText(/widths="120,373"/)).toBeVisible()
    expect(screen.getByText(/:::database\[제목\]/)).toBeVisible()
    expect(screen.getByText(/:::gallery\{size="small"\}/)).toBeVisible()
    expect(screen.getByText(/::video\{src="URL" width=144\}/)).toBeVisible()
  })

  describe('하위 페이지 링크 미리보기', () => {
    it('resolvePageLinks가 없으면 바로 그리고 모든 ::page 링크를 찾을 수 없음으로 표시한다', async () => {
      const { user } = renderField({ defaultValue: PAGE_LINK_CONTENT })

      await user.click(screen.getByRole('button', { name: '미리보기' }))

      const preview = screen.getByTestId('content-preview')
      expect(within(preview).queryByText(LOADING)).not.toBeInTheDocument()
      expect(
        within(preview).getByText('찾을 수 없는 하위 페이지: schedule'),
      ).toBeInTheDocument()
      expect(
        within(preview).getByText('찾을 수 없는 하위 페이지: dsf26/faq'),
      ).toBeInTheDocument()
      expect(within(preview).queryByRole('link')).not.toBeInTheDocument()
    })

    it('링크를 푸는 동안 안내를 보이고, 풀린 링크는 새 창 링크로, 못 푼 링크는 찾을 수 없음으로 그린다', async () => {
      const pending = deferred<NotionPageLinks>()
      const resolvePageLinks = vi.fn<PreviewPageLinks>(() => pending.promise)
      const { user } = renderField(
        {
          defaultValue: PAGE_LINK_CONTENT,
          resolvePageLinks,
          businessIdField: 'id',
        },
        <input type="hidden" name="id" value="7" readOnly />,
      )

      await user.click(screen.getByRole('button', { name: '미리보기' }))

      const preview = screen.getByTestId('content-preview')
      expect(within(preview).getByText(LOADING)).toBeInTheDocument()
      // 푸는 중에는 아직 찾지 못한 링크를 단정하지 않는다.
      expect(
        within(preview).queryByText(/찾을 수 없는 하위 페이지/),
      ).not.toBeInTheDocument()
      // 본문은 링크를 기다리지 않고 먼저 그린다.
      expect(
        within(preview).getByRole('heading', { level: 2, name: '행사 소개' }),
      ).toBeInTheDocument()
      expect(resolvePageLinks).toHaveBeenCalledTimes(1)
      expect(resolvePageLinks).toHaveBeenCalledWith(7, PAGE_LINK_CONTENT)

      await act(async () => {
        pending.resolve(SCHEDULE_LINK)
      })

      expect(within(preview).queryByText(LOADING)).not.toBeInTheDocument()
      const link = within(preview).getByRole('link', { name: '세부 일정' })
      expect(link).toHaveAttribute('href', '/hackathon/dsf25/schedule')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(
        within(preview).queryByText('찾을 수 없는 하위 페이지: schedule'),
      ).not.toBeInTheDocument()
      expect(
        within(preview).getByText('찾을 수 없는 하위 페이지: dsf26/faq'),
      ).toBeInTheDocument()
    })

    it('같은 폼의 select에서 행사 ID를 읽고 지금 입력한 본문을 넘긴다', async () => {
      const resolvePageLinks = vi.fn<PreviewPageLinks>(async () => ({}))
      const { user } = renderField(
        { defaultValue: '', resolvePageLinks, businessIdField: 'businessId' },
        <label>
          행사
          <select name="businessId" defaultValue="">
            <option value="">선택</option>
            <option value="12">해커톤</option>
          </select>
        </label>,
      )

      await user.selectOptions(
        screen.getByRole('combobox', { name: '행사' }),
        '12',
      )
      await user.type(
        screen.getByLabelText('행사 페이지 본문'),
        '::page{{path="faq"}',
      )
      await user.click(screen.getByRole('button', { name: '미리보기' }))

      expect(resolvePageLinks).toHaveBeenCalledWith(12, '::page{path="faq"}')
      expect(
        await screen.findByText('찾을 수 없는 하위 페이지: faq'),
      ).toBeInTheDocument()
      expect(screen.queryByText(LOADING)).not.toBeInTheDocument()
    })

    it.each([
      ['빈 값', ''],
      ['0', '0'],
      ['음수', '-3'],
      ['소수', '1.5'],
      ['숫자가 아닌 값', 'abc'],
    ])('행사 ID 입력이 %s이면 null을 넘긴다', async (_label, value) => {
      const resolvePageLinks = vi.fn<PreviewPageLinks>(async () => ({}))
      const { user } = renderField(
        { resolvePageLinks, businessIdField: 'id' },
        <input type="hidden" name="id" value={value} readOnly />,
      )

      await user.click(screen.getByRole('button', { name: '미리보기' }))

      expect(resolvePageLinks).toHaveBeenCalledWith(
        null,
        '# 행사 소개\n\n**굵게** 본문',
      )
    })

    it('businessIdField가 없거나, 폼에 그 이름의 입력이 없거나, input·select가 아니면 null을 넘긴다', async () => {
      const resolvePageLinks = vi.fn<PreviewPageLinks>(async () => ({}))
      const controls = (
        <>
          <input type="hidden" name="id" value="5" readOnly />
          <textarea name="memo" defaultValue="9" aria-label="메모" />
        </>
      )

      const noField = renderField({ resolvePageLinks }, controls)
      await noField.user.click(screen.getByRole('button', { name: '미리보기' }))
      noField.unmount()

      const missing = renderField(
        { resolvePageLinks, businessIdField: 'businessId' },
        controls,
      )
      await missing.user.click(screen.getByRole('button', { name: '미리보기' }))
      missing.unmount()

      const textarea = renderField(
        { resolvePageLinks, businessIdField: 'memo' },
        controls,
      )
      await textarea.user.click(
        screen.getByRole('button', { name: '미리보기' }),
      )

      expect(resolvePageLinks).toHaveBeenCalledTimes(3)
      for (const [businessId] of resolvePageLinks.mock.calls) {
        expect(businessId).toBeNull()
      }
    })

    it('폼 밖에 놓이면 행사 ID 없이 링크를 푼다', async () => {
      const resolvePageLinks = vi.fn<PreviewPageLinks>(async () => ({}))
      const { user } = renderWithChakra(
        <NotionContentField
          name="content"
          label="행사 페이지 본문"
          defaultValue="본문"
          resolvePageLinks={resolvePageLinks}
          businessIdField="id"
        />,
      )

      await user.click(screen.getByRole('button', { name: '미리보기' }))

      expect(resolvePageLinks).toHaveBeenCalledWith(null, '본문')
    })

    it('링크를 풀다 실패해도 미리보기를 그리고 링크는 찾을 수 없음으로 표시한다', async () => {
      const resolvePageLinks = vi.fn<PreviewPageLinks>(async () => {
        throw new Error('서버 오류')
      })
      const { user } = renderField({
        defaultValue: PAGE_LINK_CONTENT,
        resolvePageLinks,
        businessIdField: 'id',
      })

      await user.click(screen.getByRole('button', { name: '미리보기' }))

      const preview = screen.getByTestId('content-preview')
      expect(
        await within(preview).findByText('찾을 수 없는 하위 페이지: schedule'),
      ).toBeInTheDocument()
      expect(
        within(preview).getByText('찾을 수 없는 하위 페이지: dsf26/faq'),
      ).toBeInTheDocument()
      expect(within(preview).queryByText(LOADING)).not.toBeInTheDocument()
      expect(
        within(preview).getByRole('heading', { level: 2, name: '행사 소개' }),
      ).toBeInTheDocument()
    })

    it('늦게 도착한 이전 응답은 새 응답을 덮어쓰지 않는다', async () => {
      const first = deferred<NotionPageLinks>()
      const second = deferred<NotionPageLinks>()
      const resolvePageLinks = vi
        .fn<PreviewPageLinks>()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)
      const { user } = renderField({
        defaultValue: '::page{path="schedule"}',
        resolvePageLinks,
      })

      await user.click(screen.getByRole('button', { name: '미리보기' }))
      await user.click(screen.getByRole('button', { name: '편집' }))
      await user.type(screen.getByLabelText('행사 페이지 본문'), '\n\n끝')
      await user.click(screen.getByRole('button', { name: '미리보기' }))

      expect(resolvePageLinks).toHaveBeenNthCalledWith(
        2,
        null,
        '::page{path="schedule"}\n\n끝',
      )

      await act(async () => {
        second.resolve(SCHEDULE_LINK)
      })
      const preview = screen.getByTestId('content-preview')
      expect(
        within(preview).getByRole('link', { name: '세부 일정' }),
      ).toHaveAttribute('href', '/hackathon/dsf25/schedule')

      await act(async () => {
        first.resolve({})
      })
      expect(
        within(preview).getByRole('link', { name: '세부 일정' }),
      ).toBeInTheDocument()
      expect(
        within(preview).queryByText(/찾을 수 없는 하위 페이지/),
      ).not.toBeInTheDocument()
    })

    it('새 요청이 끝나기 전에 이전 응답이 오면 계속 불러오는 중으로 둔다', async () => {
      const first = deferred<NotionPageLinks>()
      const second = deferred<NotionPageLinks>()
      const resolvePageLinks = vi
        .fn<PreviewPageLinks>()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)
      const { user } = renderField({
        defaultValue: '::page{path="schedule"}',
        resolvePageLinks,
      })

      await user.click(screen.getByRole('button', { name: '미리보기' }))
      await user.click(screen.getByRole('button', { name: '미리보기' }))

      await act(async () => {
        first.resolve(SCHEDULE_LINK)
      })
      const preview = screen.getByTestId('content-preview')
      expect(within(preview).getByText(LOADING)).toBeInTheDocument()
      expect(within(preview).queryByRole('link')).not.toBeInTheDocument()

      await act(async () => {
        second.reject(new Error('서버 오류'))
      })
      expect(within(preview).queryByText(LOADING)).not.toBeInTheDocument()
      expect(
        within(preview).getByText('찾을 수 없는 하위 페이지: schedule'),
      ).toBeInTheDocument()
    })
  })
})

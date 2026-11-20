import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, waitFor } from '@/tests/utils/render'
import {
  makeBusiness,
  makeFileAsset,
  makeHistory,
  makeImageAsset,
  makeInstitution,
  makeMarkdown,
  makeReport,
  makeWebpage,
} from '@/tests/utils/fixtures'
import { FileFormDrawer } from './file-form'
import { HistoryFormDrawer } from './history-form'
import { ImageFormDrawer } from './image-form'
import { InstitutionFormDrawer } from './institution-form'
import { MarkdownFormDrawer } from './markdown-form'
import { ReportFormDrawer } from './report-form'
import { WebpageFormDrawer } from './webpage-form'

vi.mock('../toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}))

const action = vi.fn(async () => {})
const onOpenChange = vi.fn()

describe('asset and content entity form drawers', () => {
  it('renders file create/edit fields', () => {
    renderWithChakra(
      <FileFormDrawer
        open
        onOpenChange={onOpenChange}
        file={makeFileAsset()}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '파일 수정 #1' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('URL')).toHaveValue(
      'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/report.pdf',
    )
    expect(screen.getByLabelText('파일')).toHaveAttribute(
      'accept',
      'application/pdf',
    )
    expect(screen.getByLabelText('파일명')).toHaveValue('report.pdf')
    expect(screen.getByLabelText('MIME 타입')).toHaveValue('application/pdf')
  })

  it('renders image create/edit fields', () => {
    renderWithChakra(
      <ImageFormDrawer
        open
        onOpenChange={onOpenChange}
        image={makeImageAsset()}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '이미지 수정 #1' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('URL')).toHaveValue(
      'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo.png',
    )
    expect(screen.getByLabelText('파일')).toHaveAttribute('accept', 'image/*')
    expect(screen.getByLabelText('파일명')).toHaveValue('logo.png')
    expect(screen.getByLabelText('대체 텍스트')).toHaveValue('Logo')
  })

  it('renders history fields with image options', () => {
    renderWithChakra(
      <HistoryFormDrawer
        open
        onOpenChange={onOpenChange}
        history={makeHistory({ imageId: 1 })}
        images={[
          makeImageAsset(),
          makeImageAsset({
            id: 2,
            filename: null,
            url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/x.png',
          }),
        ]}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '연혁 수정 #1' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('일자')).toHaveValue('2026-05-01')
    expect(screen.getByLabelText('제목')).toHaveValue('첫 이사회')
    expect(screen.getByLabelText('내용')).toHaveValue('정관 채택')
    expect(screen.getByLabelText('이미지')).toHaveValue('1')
    expect(
      screen.getByRole('option', { name: '#1 logo.png' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', {
        name: '#2 https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/x.png',
      }),
    ).toBeInTheDocument()
  })

  it('renders institution fields with logo options', () => {
    renderWithChakra(
      <InstitutionFormDrawer
        open
        onOpenChange={onOpenChange}
        institution={makeInstitution()}
        images={[makeImageAsset()]}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '기관 수정 #1' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('국문명')).toHaveValue('기관명')
    expect(screen.getByLabelText('영문명')).toHaveValue('Institution')
    expect(screen.getByLabelText('URL')).toHaveValue('https://example.com')
    expect(screen.getByLabelText('로고 이미지')).toHaveValue('1')
    expect(
      screen.getByRole('option', { name: '#1 logo.png' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /홈/ })).toBeChecked()
  })

  it('keeps only the Korean name required for institutions and defaults the home flag on', () => {
    renderWithChakra(
      <InstitutionFormDrawer
        open
        onOpenChange={onOpenChange}
        images={[
          makeImageAsset({
            id: 7,
            filename: null,
            url: 'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo-7.png',
          }),
        ]}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '기관 추가' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', {
        name: '#7 https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo-7.png',
      }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('국문명')).toBeRequired()
    expect(screen.getByLabelText('영문명')).not.toBeRequired()
    expect(screen.getByLabelText('URL')).not.toBeRequired()
    expect(screen.getByLabelText('로고 이미지')).not.toBeRequired()
    expect(screen.getByLabelText('로고 이미지')).toHaveValue('')
    expect(
      screen.getByRole('option', { name: '로고 없음' }),
    ).toBeInTheDocument()
    const homeCheckbox = screen.getByRole('checkbox', {
      name: '홈 ‘함께하는 기관’ 로고 흐름에 보이기(로고 필요)',
    })
    expect(homeCheckbox).toBeChecked()
    expect(homeCheckbox).toHaveAttribute('name', 'showOnHome')
  })

  it.each([
    ['checked (default)', false, 'on'],
    ['unchecked', true, null],
  ])(
    'submits showOnHome as the action expects when %s',
    async (_label, uncheck, expected) => {
      const submit = vi.fn<(formData: FormData) => Promise<void>>(
        async () => {},
      )
      const { user } = renderWithChakra(
        <InstitutionFormDrawer
          open
          onOpenChange={onOpenChange}
          images={[]}
          action={submit}
        />,
      )

      await user.type(screen.getByLabelText('국문명'), '과학기술정보통신부')
      if (uncheck) {
        await user.click(
          screen.getByText(/홈 ‘함께하는 기관’ 로고 흐름에 보이기/),
        )
        expect(screen.getByRole('checkbox', { name: /홈/ })).not.toBeChecked()
      }
      await user.click(screen.getByRole('button', { name: '저장' }))

      await waitFor(() => expect(submit).toHaveBeenCalledTimes(1))
      const formData = submit.mock.calls[0][0]
      // createInstitution/updateInstitution은 'on'일 때만 홈 노출을 켠다.
      expect(formData.get('showOnHome')).toBe(expected)
      expect(formData.get('nameKo')).toBe('과학기술정보통신부')
      expect(formData.get('logoId')).toBe('')
    },
  )

  it('renders an institution with no optional values and the home flag off', () => {
    renderWithChakra(
      <InstitutionFormDrawer
        open
        onOpenChange={onOpenChange}
        institution={makeInstitution({
          nameEn: null,
          url: null,
          logoId: null,
          showOnHome: false,
        })}
        images={[]}
        action={action}
      />,
    )

    expect(screen.getByLabelText('영문명')).toHaveValue('')
    expect(screen.getByLabelText('URL')).toHaveValue('')
    expect(screen.getByLabelText('로고 이미지')).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: /홈/ })).not.toBeChecked()
  })

  it('renders markdown fields with document type options', () => {
    renderWithChakra(
      <MarkdownFormDrawer
        open
        onOpenChange={onOpenChange}
        markdown={makeMarkdown({ type: 'privacy' })}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '마크다운 수정 #1' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual([
      '정관',
      '개인정보처리방침',
      '이용약관',
      '해커톤&아이디어톤 소개',
      '컨퍼런스&프로그램 소개',
    ])
    expect(screen.getByLabelText('유형')).toHaveValue('privacy')
    expect(screen.getByLabelText('개정일')).toHaveValue('2026-01-01')
    expect(screen.getByLabelText('시행일')).toHaveValue('2026-01-10')
    expect(screen.getByLabelText('내용')).toHaveValue('# 정관\n\n본문')
  })

  it('renders report fields with file options', () => {
    renderWithChakra(
      <ReportFormDrawer
        open
        onOpenChange={onOpenChange}
        report={makeReport({ type: 'donation' })}
        files={[makeFileAsset()]}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '보고서 수정 #1' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: '기부금 모금액 및 활용실적' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('제목')).toHaveValue('2026 1분기 회의록')
    expect(screen.getByLabelText('게시일')).toHaveValue('2026-03-31')
    expect(
      screen.getByRole('option', { name: '#1 report.pdf' }),
    ).toBeInTheDocument()
  })

  it('renders webpage fields with business options', () => {
    renderWithChakra(
      <WebpageFormDrawer
        open
        onOpenChange={onOpenChange}
        webpage={makeWebpage({ businessId: 1 })}
        businesses={[makeBusiness()]}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '웹페이지 수정 #1' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: '블로그 포스트' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('URL')).toHaveValue(
      'https://blog.example.com/post',
    )
    expect(screen.getByLabelText('제목')).toHaveValue('블로그 글')
    expect(screen.getByLabelText('작성자')).toHaveValue('홍길동')
    expect(screen.getByLabelText('게시일')).toHaveValue('2026-05-01')
    expect(screen.getByLabelText('관련 행사(사업)')).toHaveValue('1')
    expect(
      screen.getByRole('option', { name: '#1 Hackathon 2026' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: '관련 행사 없음(보도 자료만 가능)' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/뉴스 기사·블로그 포스트는 행사를 골라야 하며/),
    ).toBeInTheDocument()
  })
})

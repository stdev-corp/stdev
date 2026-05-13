import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
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
        images={[makeImageAsset()]}
        action={action}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '연혁 수정 #1' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('일자')).toHaveValue('2026-05-01')
    expect(screen.getByLabelText('제목')).toHaveValue('첫 이사회')
    expect(screen.getByLabelText('내용')).toHaveValue('정관 채택')
    expect(
      screen.getByRole('option', { name: '#1 logo.png' }),
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
    expect(
      screen.getByRole('option', { name: '#1 logo.png' }),
    ).toBeInTheDocument()
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
      screen.getByRole('option', { name: '개인정보처리방침' }),
    ).toBeInTheDocument()
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
    expect(
      screen.getByRole('option', { name: '#1 Hackathon 2026' }),
    ).toBeInTheDocument()
  })
})

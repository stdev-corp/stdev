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
import { FileListClient } from './file-list-client'
import { HistoryListClient } from './history-list-client'
import { ImageListClient } from './image-list-client'
import { InstitutionListClient } from './institution-list-client'
import { MarkdownListClient } from './markdown-list-client'
import { ReportListClient } from './report-list-client'
import { WebpageListClient } from './webpage-list-client'

const noop = vi.fn(async () => {})

describe('asset and content list clients', () => {
  it('renders file list and opens edit drawer', async () => {
    const { user } = renderWithChakra(
      <FileListClient
        files={[makeFileAsset()]}
        actions={{
          createFileAsset: noop,
          updateFileAsset: noop,
          deleteFileAsset: noop,
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: '파일' })).toBeInTheDocument()
    expect(screen.getByText('#1 · report.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '파일 추가' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(
      screen.getByRole('heading', { name: '파일 수정 #1' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(
      screen.queryByRole('heading', { name: '파일 수정 #1' }),
    ).not.toBeInTheDocument()
  })

  it('renders image list and opens create drawer', async () => {
    const { user } = renderWithChakra(
      <ImageListClient
        images={[makeImageAsset()]}
        actions={{
          createImageAsset: noop,
          updateImageAsset: noop,
          deleteImageAsset: noop,
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: '이미지' })).toBeInTheDocument()
    expect(screen.getByText('#1 · logo.png')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '이미지 추가' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(
      screen.getByRole('heading', { name: '이미지 수정 #1' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(
      screen.queryByRole('heading', { name: '이미지 수정 #1' }),
    ).not.toBeInTheDocument()
  })

  it('renders history list with formatted date and opens drawers', async () => {
    const { user } = renderWithChakra(
      <HistoryListClient
        histories={[makeHistory()]}
        images={[makeImageAsset()]}
        actions={{
          createHistory: noop,
          updateHistory: noop,
          deleteHistory: noop,
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: '연혁' })).toBeInTheDocument()
    expect(screen.getByText('#1 · 첫 이사회')).toBeInTheDocument()
    expect(screen.getByText('2026년 5월 1일')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '연혁 추가' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(
      screen.getByRole('heading', { name: '연혁 수정 #1' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(
      screen.queryByRole('heading', { name: '연혁 수정 #1' }),
    ).not.toBeInTheDocument()
  })

  it('renders institution list metadata and opens drawers', async () => {
    const { user } = renderWithChakra(
      <InstitutionListClient
        institutions={[makeInstitution()]}
        images={[makeImageAsset()]}
        actions={{
          createInstitution: noop,
          updateInstitution: noop,
          deleteInstitution: noop,
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: '기관' })).toBeInTheDocument()
    expect(screen.getByText('#1 · 기관명')).toBeInTheDocument()
    expect(
      screen.getByText('Institution · https://example.com'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '기관 추가' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(
      screen.getByRole('heading', { name: '기관 수정 #1' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(
      screen.queryByRole('heading', { name: '기관 수정 #1' }),
    ).not.toBeInTheDocument()
  })

  it('renders all markdown type labels and opens drawers', async () => {
    const { user } = renderWithChakra(
      <MarkdownListClient
        markdowns={[
          makeMarkdown({ id: 1, type: 'articles' }),
          makeMarkdown({ id: 2, type: 'privacy' }),
          makeMarkdown({ id: 3, type: 'terms' }),
        ]}
        actions={{
          createMarkdown: noop,
          updateMarkdown: noop,
          deleteMarkdown: noop,
        }}
      />,
    )

    expect(screen.getByText('#1 · 정관')).toBeInTheDocument()
    expect(screen.getByText('#2 · 개인정보처리방침')).toBeInTheDocument()
    expect(screen.getByText('#3 · 이용약관')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '마크다운 추가' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    expect(
      screen.getByRole('heading', { name: '마크다운 수정 #1' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(
      screen.queryByRole('heading', { name: '마크다운 수정 #1' }),
    ).not.toBeInTheDocument()
  })

  it('renders both report type labels and opens drawers', async () => {
    const { user } = renderWithChakra(
      <ReportListClient
        reports={[
          makeReport({ id: 1, type: 'meeting' }),
          makeReport({ id: 2, type: 'donation' }),
        ]}
        files={[makeFileAsset()]}
        actions={{ createReport: noop, updateReport: noop, deleteReport: noop }}
      />,
    )

    expect(screen.getByText(/총회 및 이사회/)).toBeInTheDocument()
    expect(screen.getByText(/기부금 모금액 및 활용실적/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '보고서 추가' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    expect(
      screen.getByRole('heading', { name: '보고서 수정 #1' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(
      screen.queryByRole('heading', { name: '보고서 수정 #1' }),
    ).not.toBeInTheDocument()
  })

  it('renders all webpage type labels and opens drawers', async () => {
    const { user } = renderWithChakra(
      <WebpageListClient
        webpages={[
          makeWebpage({ id: 1, type: 'blog_post' }),
          makeWebpage({ id: 2, type: 'news_article' }),
          makeWebpage({ id: 3, type: 'press_release' }),
        ]}
        businesses={[makeBusiness()]}
        actions={{
          createWebpage: noop,
          updateWebpage: noop,
          deleteWebpage: noop,
        }}
      />,
    )

    expect(screen.getByText(/블로그 포스트/)).toBeInTheDocument()
    expect(screen.getByText(/신문 기사/)).toBeInTheDocument()
    expect(screen.getByText(/보도 자료/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '웹페이지 추가' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    expect(
      screen.getByRole('heading', { name: '웹페이지 수정 #1' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(
      screen.queryByRole('heading', { name: '웹페이지 수정 #1' }),
    ).not.toBeInTheDocument()
  })
})

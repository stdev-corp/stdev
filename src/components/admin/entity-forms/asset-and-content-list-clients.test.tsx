import { describe, expect, it, vi } from 'vitest'
import { act, renderWithChakra, screen, waitFor } from '@/tests/utils/render'
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
import { FormDrawer } from '../form-drawer'

// 실제 드로어를 그대로 그리되, 받은 props를 꺼내 쓸 수 있게 감싼다.
vi.mock('../form-drawer', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../form-drawer')>()
  return { ...mod, FormDrawer: vi.fn(mod.FormDrawer) }
})

const noop = vi.fn(async () => {})

/**
 * 수정 드로어는 닫기 요청(false)에만 반응해야 한다. 열기 요청(true)이 와도
 * 편집 대상이 바뀌거나 닫히지 않는지 확인한다.
 */
function expectEditDrawerIgnoresOpenRequest(title: string) {
  const props = vi
    .mocked(FormDrawer)
    .mock.calls.map(([drawerProps]) => drawerProps)
    .findLast((drawerProps) => drawerProps.title === title)!
  act(() => props.onOpenChange(true))
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
}

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
    expectEditDrawerIgnoresOpenRequest('파일 수정 #1')
    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '파일 수정 #1' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('shows fallbacks for files without a MIME type', () => {
    renderWithChakra(
      <FileListClient
        files={[
          makeFileAsset({ id: 1, mimeType: null }),
          makeFileAsset({ id: 2, filename: 'no-url.pdf', url: null }),
        ]}
        actions={{
          createFileAsset: noop,
          updateFileAsset: noop,
          deleteFileAsset: noop,
        }}
      />,
    )

    expect(
      screen.getByText(
        'mime 없음 · https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/report.pdf',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('application/pdf · URL 없음')).toBeInTheDocument()
  })

  it('shows fallbacks for images without filename or alt text', () => {
    renderWithChakra(
      <ImageListClient
        images={[
          makeImageAsset({ id: 1, filename: null, alt: null }),
          makeImageAsset({ id: 2, filename: 'broken.png', url: null }),
        ]}
        actions={{
          createImageAsset: noop,
          updateImageAsset: noop,
          deleteImageAsset: noop,
        }}
      />,
    )

    expect(screen.getByText('#1 · (no filename)')).toBeInTheDocument()
    expect(screen.getByText('alt 없음 · 연결됨')).toBeInTheDocument()
    expect(screen.getByText('Logo · URL 없음')).toBeInTheDocument()
    expect(screen.getAllByText('URL 없음')).toHaveLength(1)
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
    expectEditDrawerIgnoresOpenRequest('이미지 수정 #1')
    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '이미지 수정 #1' }),
      ).not.toBeInTheDocument(),
    )
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
    expectEditDrawerIgnoresOpenRequest('연혁 수정 #1')
    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '연혁 수정 #1' }),
      ).not.toBeInTheDocument(),
    )
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
      screen.getByText('Institution · https://example.com · 홈 노출'),
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
    expectEditDrawerIgnoresOpenRequest('기관 수정 #1')
    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '기관 수정 #1' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('summarizes optional institution fields and the home flag', () => {
    renderWithChakra(
      <InstitutionListClient
        institutions={[
          makeInstitution({
            id: 1,
            nameKo: '이름만',
            nameEn: null,
            url: null,
            logoId: null,
            showOnHome: true,
          }),
          makeInstitution({
            id: 2,
            nameKo: 'URL만',
            nameEn: null,
            url: 'https://only-url.example.com',
            logoId: 3,
            showOnHome: false,
          }),
          makeInstitution({
            id: 3,
            nameKo: '영문만',
            nameEn: 'English Only',
            url: null,
            logoId: 4,
            showOnHome: true,
          }),
        ]}
        images={[makeImageAsset()]}
        actions={{
          createInstitution: noop,
          updateInstitution: noop,
          deleteInstitution: noop,
        }}
      />,
    )

    // 로고가 없으면 홈 노출을 켜도 홈에 나오지 않으므로 표시하지 않는다.
    expect(screen.getByText('영문명·URL 없음')).toBeInTheDocument()
    expect(screen.getByText('https://only-url.example.com')).toBeInTheDocument()
    expect(screen.getByText('English Only · 홈 노출')).toBeInTheDocument()
    expect(screen.getAllByText(/홈 노출/)).toHaveLength(1)
  })

  it('renders all markdown type labels and opens drawers', async () => {
    const { user } = renderWithChakra(
      <MarkdownListClient
        markdowns={[
          makeMarkdown({ id: 1, type: 'articles' }),
          makeMarkdown({ id: 2, type: 'privacy' }),
          makeMarkdown({ id: 3, type: 'terms' }),
          makeMarkdown({ id: 4, type: 'hackathon' }),
          makeMarkdown({ id: 5, type: 'conference' }),
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
    expect(screen.getByText('#4 · 해커톤&아이디어톤 소개')).toBeInTheDocument()
    expect(screen.getByText('#5 · 컨퍼런스&프로그램 소개')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(
      screen.getByRole('heading', { name: '마크다운 추가' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    expect(
      screen.getByRole('heading', { name: '마크다운 수정 #1' }),
    ).toBeInTheDocument()
    expectEditDrawerIgnoresOpenRequest('마크다운 수정 #1')
    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '마크다운 수정 #1' }),
      ).not.toBeInTheDocument(),
    )
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
    expectEditDrawerIgnoresOpenRequest('보고서 수정 #1')
    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '보고서 수정 #1' }),
      ).not.toBeInTheDocument(),
    )
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
    expect(screen.getByText(/뉴스 기사/)).toBeInTheDocument()
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
    expectEditDrawerIgnoresOpenRequest('웹페이지 수정 #1')
    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: '웹페이지 수정 #1' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('opens each webpage with its own type even though the edit drawer is reused', async () => {
    const { user } = renderWithChakra(
      <WebpageListClient
        webpages={[
          makeWebpage({ id: 2, type: 'news_article', businessId: 1 }),
          makeWebpage({ id: 3, type: 'press_release', businessId: null }),
          makeWebpage({ id: 1, type: 'blog_post', businessId: 1 }),
        ]}
        businesses={[makeBusiness()]}
        actions={{
          createWebpage: noop,
          updateWebpage: noop,
          deleteWebpage: noop,
        }}
      />,
    )

    // EntityList는 수정 서랍을 처음부터 (레코드 없이) 그려 둔다. 그 뒤에 고른
    // 레코드의 유형이 서랍에 남아 있던 기본값(블로그 포스트)으로 바뀌면 안 된다.
    for (const [index, id, type, required] of [
      [0, 2, 'news_article', true],
      [1, 3, 'press_release', false],
      [2, 1, 'blog_post', true],
    ] as const) {
      await user.click(screen.getAllByRole('button', { name: '수정' })[index])
      expect(
        screen.getByRole('heading', { name: `웹페이지 수정 #${id}` }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('유형')).toHaveValue(type)
      if (required) {
        expect(screen.getByLabelText('관련 행사(사업)')).toBeRequired()
      } else {
        expect(screen.getByLabelText('관련 행사(사업)')).not.toBeRequired()
      }
      await user.click(screen.getByRole('button', { name: '취소' }))
      await waitFor(() =>
        expect(
          screen.queryByRole('heading', { name: `웹페이지 수정 #${id}` }),
        ).not.toBeInTheDocument(),
      )
    }
  })
})

import { describe, expect, it } from 'vitest'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import RecordList from '@/components/record-list'
import type { ReportWithFile } from '@/utils/cms-types'

describe('<RecordList>', () => {
  it('renders empty-state message when no reports provided', () => {
    const { container } = renderWithChakra(<RecordList reports={[]} />)
    expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
    expect(container.querySelectorAll('a').length).toBe(0)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders a single report with title, date, and PDF download link', () => {
    const reports: ReportWithFile[] = [
      {
        id: 1,
        title: '2026 Q1 Report',
        publishedDate: new Date('2026-04-01T00:00:00Z'),
        file_url:
          'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/q1.pdf',
      },
    ]
    renderWithChakra(<RecordList reports={reports} />)
    expect(
      screen.getByRole('rowheader', { name: '2026 Q1 Report' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2026년 4월 1일')).toBeInTheDocument()
    const link = screen.getByRole('link', {
      name: '2026 Q1 Report PDF 새 창으로 열기',
    })
    expect(link).toHaveTextContent('PDF')
    expect(link).toHaveAttribute(
      'href',
      'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/q1.pdf',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders multiple reports in order with PDF links', () => {
    const reports: ReportWithFile[] = [
      {
        id: 1,
        title: 'Report A',
        publishedDate: new Date('2026-04-01T00:00:00Z'),
        file_url: 'https://example.com/a.pdf',
      },
      {
        id: 2,
        title: 'Report B',
        publishedDate: new Date('2026-05-01T00:00:00Z'),
        file_url: 'https://example.com/b.pdf',
      },
    ]
    renderWithChakra(<RecordList reports={reports} />)
    expect(
      screen.getByRole('rowheader', { name: 'Report A' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('rowheader', { name: 'Report B' }),
    ).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /PDF 새 창으로 열기$/ })
    expect(links.length).toBe(2)
    expect(links[0]).toHaveAccessibleName('Report A PDF 새 창으로 열기')
    expect(links[0]).toHaveAttribute('href', 'https://example.com/a.pdf')
    expect(links[1]).toHaveAccessibleName('Report B PDF 새 창으로 열기')
    expect(links[1]).toHaveAttribute('href', 'https://example.com/b.pdf')
  })

  it('each PDF link has target="_blank" and rel="noopener noreferrer"', () => {
    const reports: ReportWithFile[] = [
      {
        id: 1,
        title: 'Only Report',
        publishedDate: new Date('2026-01-01T00:00:00Z'),
        file_url: 'https://example.com/only.pdf',
      },
    ]
    renderWithChakra(<RecordList reports={reports} />)
    const link = screen.getByRole('link', {
      name: 'Only Report PDF 새 창으로 열기',
    })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('href', 'https://example.com/only.pdf')
  })

  it('formats publishedDate in Korean style (KST day boundary)', () => {
    const reports: ReportWithFile[] = [
      {
        id: 1,
        title: 'Boundary Report',
        publishedDate: new Date('2026-05-06T15:30:00Z'),
        file_url: 'https://example.com/x.pdf',
      },
    ]
    renderWithChakra(<RecordList reports={reports} />)
    const row = screen.getByRole('rowheader', {
      name: 'Boundary Report',
    }).parentElement as HTMLElement
    expect(within(row).getByText('2026년 5월 7일')).toBeInTheDocument()
  })
})

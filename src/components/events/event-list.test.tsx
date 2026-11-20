import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@/tests/utils/render'
import EventList from '@/components/events/event-list'
import type { EventSummary } from '@/utils/cms-types'
import { toEventInstant } from '@/utils/events'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

// MarkdownView는 async 서버 컴포넌트라 클라이언트 렌더러에서 그릴 수 없다.
vi.mock('@/components/markdown/markdown-view', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown-view">{content}</div>
  ),
}))

function makeEvent(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: 1,
    name: 'DSF 2026',
    slug: 'dsf26',
    category: 'hackathon',
    href: '/hackathon/dsf26',
    startDate: new Date('2026-04-18T00:00:00Z'),
    endDate: new Date('2026-04-19T00:00:00Z'),
    hasTime: false,
    location: '서울 강남구',
    summary: '행사 **요약**',
    roles: [
      {
        role: 'host',
        label: '주최',
        organizations: [
          { name: 'STDev', url: 'https://stdev.kr' },
          { name: 'KAIST', url: null },
        ],
      },
      {
        role: 'partner',
        label: '협력',
        organizations: [{ name: '협력사', url: null }],
      },
    ],
    ...overrides,
  }
}

function items(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('ul.event-list > li.event-item'),
  )
}

function metaPairs(item: HTMLElement) {
  return Array.from(item.querySelectorAll('.event-item-meta > div')).map(
    (row) => [
      row.querySelector('dt')?.textContent,
      row.querySelector('dd')?.textContent,
    ],
  )
}

describe('<EventList>', () => {
  it('행사가 없으면 빈 목록 안내를 보여 준다', () => {
    const { container } = render(<EventList events={[]} />)

    expect(screen.getByText('등록된 행사가 없습니다.')).toHaveClass('g-empty')
    expect(container.querySelector('ul')).toBeNull()
  })

  it('받은 순서 그대로 행사를 그린다', () => {
    const { container } = render(
      <EventList
        events={[
          makeEvent({ id: 3, name: '2026 행사' }),
          makeEvent({ id: 2, name: '2025 행사' }),
          makeEvent({ id: 1, name: '2024 행사' }),
        ]}
      />,
    )

    expect(
      items(container).map(
        (item) => item.querySelector('.event-item-tit')?.textContent,
      ),
    ).toEqual(['2026 행사', '2025 행사', '2024 행사'])
  })

  it('행사 이름을 h3 제목 링크로 만들고 짧은 개최 기간을 함께 보여 준다', () => {
    const { container } = render(<EventList events={[makeEvent()]} />)
    const [item] = items(container)

    const title = within(item).getByRole('heading', { level: 3 })
    expect(title).toHaveClass('event-item-tit')
    const link = within(title).getByRole('link', { name: 'DSF 2026' })
    expect(link).toHaveAttribute('href', '/hackathon/dsf26')

    const period = item.querySelector('.event-item-period')!
    expect(period).toHaveTextContent('개최일 2026.04.18. - 04.19.')
    expect(period.querySelector('.sr-only')).toHaveTextContent('개최일')
  })

  it('분류, 일시, 장소, 역할별 기관을 메타 정보로 보여 준다', () => {
    const { container } = render(<EventList events={[makeEvent()]} />)
    const [item] = items(container)

    expect(metaPairs(item)).toEqual([
      ['분류', '해커톤'],
      ['일시', '2026년 4월 18일 (토) ~ 4월 19일 (일)'],
      ['장소', '서울 강남구'],
      ['주최', 'STDev, KAIST'],
      ['협력', '협력사'],
    ])
    expect(within(item).getByRole('link', { name: 'STDev' })).toHaveAttribute(
      'target',
      '_blank',
    )
  })

  it('요약은 마크다운으로 그린다', () => {
    const { container } = render(<EventList events={[makeEvent()]} />)
    const [item] = items(container)

    const summary = item.querySelector('.event-item-summary')!
    expect(
      within(summary as HTMLElement).getByTestId('markdown-view'),
    ).toHaveTextContent('행사 **요약**')
  })

  it('행사 페이지 바로가기 버튼은 스크린리더에 행사 이름을 함께 알린다', () => {
    const { container } = render(<EventList events={[makeEvent()]} />)
    const [item] = items(container)

    const more = within(item).getByRole('link', {
      name: '행사 페이지 보기: DSF 2026',
    })
    expect(more).toHaveAttribute('href', '/hackathon/dsf26')
    expect(more).toHaveClass('krds-btn', 'small', 'secondary')
    expect(more.closest('p')).toHaveClass('event-item-more')
  })

  it('행사 페이지가 없는 행사는 링크 없이 이름만 보여 준다', () => {
    const { container } = render(
      <EventList events={[makeEvent({ slug: null, href: null })]} />,
    )
    const [item] = items(container)

    expect(within(item).getByRole('heading', { level: 3 })).toHaveTextContent(
      'DSF 2026',
    )
    expect(within(item).queryByRole('link', { name: /DSF 2026/ })).toBeNull()
    expect(item.querySelector('.event-item-more')).toBeNull()
  })

  it('장소, 기관, 요약이 없으면 그 칸을 빼고 분류별 이름을 쓴다', () => {
    const { container } = render(
      <EventList
        events={[
          makeEvent({
            id: 1,
            category: 'ideathon',
            location: null,
            roles: [],
            summary: null,
          }),
          makeEvent({ id: 2, category: 'conference' }),
          makeEvent({ id: 3, category: 'program' }),
        ]}
      />,
    )
    const [ideathon, conference, program] = items(container)

    expect(metaPairs(ideathon)).toEqual([
      ['분류', '아이디어톤'],
      ['일시', '2026년 4월 18일 (토) ~ 4월 19일 (일)'],
    ])
    expect(ideathon.querySelector('.event-item-summary')).toBeNull()
    expect(metaPairs(conference)[0]).toEqual(['분류', '컨퍼런스'])
    expect(metaPairs(program)[0]).toEqual(['분류', '프로그램'])
  })

  it('시각이 있는 행사는 일시에 한국 시각을 붙이고, 하루 행사는 기간을 한 날짜로 줄인다', () => {
    const { container } = render(
      <EventList
        events={[
          makeEvent({
            startDate: toEventInstant('2026-02-23', '14:00'),
            endDate: toEventInstant('2026-02-23', '18:30'),
            hasTime: true,
          }),
        ]}
      />,
    )
    const [item] = items(container)

    expect(metaPairs(item)[1]).toEqual([
      '일시',
      '2026년 2월 23일 (월) 14:00 ~ 18:30',
    ])
    expect(item.querySelector('.event-item-period')).toHaveTextContent(
      /^개최일 2026\.02\.23\.$/,
    )
  })
})

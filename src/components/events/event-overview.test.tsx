import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@/tests/utils/render'
import EventOverview, {
  OrganizationNames,
} from '@/components/events/event-overview'
import type { EventRoleGroup, EventSummary } from '@/utils/cms-types'
import { toEventInstant } from '@/utils/events'

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
    summary: null,
    roles: [],
    ...overrides,
  }
}

const HOST: EventRoleGroup = {
  role: 'host',
  label: '주최',
  organizations: [
    { name: '과학기술정보통신부', url: 'https://www.msit.go.kr' },
    { name: 'STDev', url: null },
  ],
}

const SPONSOR: EventRoleGroup = {
  role: 'sponsor',
  label: '후원',
  organizations: [{ name: '후원사', url: null }],
}

/** dl의 dt/dd를 [용어, 설명] 쌍으로 읽는다. */
function definitionPairs(list: HTMLElement) {
  const terms = Array.from(list.querySelectorAll('dt'))
  return terms.map((term) => [
    term.textContent,
    term.nextElementSibling?.tagName === 'DD'
      ? term.nextElementSibling.textContent
      : null,
  ])
}

describe('<OrganizationNames>', () => {
  it('기관 이름을 쉼표로 잇고 주소가 있는 기관만 새 창 링크로 만든다', () => {
    const { container } = render(<OrganizationNames group={HOST} />)

    expect(container.textContent).toBe('과학기술정보통신부, STDev')
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveTextContent('과학기술정보통신부')
    expect(links[0]).toHaveAttribute('href', 'https://www.msit.go.kr')
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
    expect(links[0]).toHaveAttribute('title', '새 창 열림')
  })

  it('기관이 하나면 쉼표 없이 이름만 그린다', () => {
    const { container } = render(<OrganizationNames group={SPONSOR} />)

    expect(container.textContent).toBe('후원사')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('기관이 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(
      <OrganizationNames group={{ ...SPONSOR, organizations: [] }} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})

describe('<EventOverview>', () => {
  it('"행사 개요" 영역에 일시, 장소, 역할별 기관을 정의 목록으로 보여 준다', () => {
    render(<EventOverview event={makeEvent({ roles: [HOST, SPONSOR] })} />)

    const region = screen.getByRole('region', { name: '행사 개요' })
    expect(region.tagName).toBe('SECTION')
    expect(region).toHaveClass('event-overview')
    const list = region.querySelector('dl')!
    expect(definitionPairs(list)).toEqual([
      ['일시', '2026년 4월 18일 (토) ~ 4월 19일 (일)'],
      ['장소', '서울 강남구'],
      ['주최', '과학기술정보통신부, STDev'],
      ['후원', '후원사'],
    ])
    expect(
      within(region).getByRole('link', { name: '과학기술정보통신부' }),
    ).toHaveAttribute('href', 'https://www.msit.go.kr')
  })

  it('시각이 있는 행사는 한국 시각으로 시각까지 보여 준다', () => {
    render(
      <EventOverview
        event={makeEvent({
          startDate: toEventInstant('2026-02-23', '14:00'),
          endDate: toEventInstant('2026-02-24', '19:00'),
          hasTime: true,
        })}
      />,
    )

    const list = screen.getByRole('region', { name: '행사 개요' })
      .firstElementChild as HTMLElement
    expect(definitionPairs(list)[0]).toEqual([
      '일시',
      '2026년 2월 23일 (월) 14:00 ~ 2월 24일 (화) 19:00',
    ])
  })

  it('장소와 기관이 없으면 일시만 보여 준다', () => {
    const { container } = render(
      <EventOverview event={makeEvent({ location: null, roles: [] })} />,
    )

    expect(definitionPairs(container.querySelector('dl')!)).toEqual([
      ['일시', '2026년 4월 18일 (토) ~ 4월 19일 (일)'],
    ])
    expect(screen.queryByText('장소')).toBeNull()
  })

  it('하루짜리 행사는 끝 날짜를 생략한다', () => {
    const { container } = render(
      <EventOverview
        event={makeEvent({
          startDate: new Date('2026-11-07T00:00:00Z'),
          endDate: new Date('2026-11-07T00:00:00Z'),
        })}
      />,
    )

    expect(container.querySelector('dd')).toHaveTextContent(
      /^2026년 11월 7일 \(토\)$/,
    )
  })
})

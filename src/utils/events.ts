import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { BusinessCategory, BusinessRole } from '@/utils/cms-types'
import { Links } from '@/utils/links'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ = 'Asia/Seoul'

/** 공개 사이트에서 행사를 나누어 보여 주는 두 구역. */
export type EventSection = 'hackathon' | 'conference'

export const EVENT_SECTIONS: Record<
  EventSection,
  {
    label: string
    href: string
    newsHref: string
    blogHref: string
    categories: BusinessCategory[]
  }
> = {
  hackathon: {
    label: '해커톤&아이디어톤',
    href: Links.hackathon,
    newsHref: Links.hackathonNews,
    blogHref: Links.hackathonBlog,
    categories: ['hackathon', 'ideathon'],
  },
  conference: {
    label: '컨퍼런스&프로그램',
    href: Links.conference,
    newsHref: Links.conferenceNews,
    blogHref: Links.conferenceBlog,
    categories: ['conference', 'program'],
  },
}

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  hackathon: '해커톤',
  ideathon: '아이디어톤',
  conference: '컨퍼런스',
  program: '프로그램',
}

/** 화면에 보이는 순서. 노션 개요와 같은 주최 → 주관 → 후원 → 협력. */
export const ROLE_ORDER: BusinessRole[] = [
  'host',
  'organizer',
  'sponsor',
  'partner',
]

export const ROLE_LABELS: Record<BusinessRole, string> = {
  host: '주최',
  organizer: '주관',
  sponsor: '후원',
  partner: '협력',
}

/**
 * 행사 슬러그로 쓸 수 없는 이름. 구역 아래의 고정 페이지 경로와 겹친다.
 */
export const RESERVED_SLUGS = ['news', 'blog']

export function sectionOfCategory(category: BusinessCategory): EventSection {
  return EVENT_SECTIONS.conference.categories.includes(category)
    ? 'conference'
    : 'hackathon'
}

export function isEventSection(value: string): value is EventSection {
  return value === 'hackathon' || value === 'conference'
}

/** 행사 슬러그: 소문자 영문, 숫자, 하이픈. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** 하위 페이지 경로: 슬러그를 '/'로 이은 것. 예) notice/team-building */
const PAGE_PATH_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/

/**
 * 노션 ID 모양(32자리 16진수, 대시 선택)의 슬러그도 쓸 수 없다. next.config.ts가
 * /hackathon/<노션 ID> 주소를 옛 노션 주소로 보고 api/legacy-notion으로 넘기므로,
 * 그런 슬러그의 행사 페이지에는 닿을 수 없다.
 */
export function isValidSlug(value: string) {
  return (
    SLUG_PATTERN.test(value) &&
    !RESERVED_SLUGS.includes(value) &&
    normalizeNotionId(value) === null
  )
}

export function isValidPagePath(value: string) {
  return PAGE_PATH_PATTERN.test(value)
}

export function eventHref(category: BusinessCategory, slug: string) {
  return `${EVENT_SECTIONS[sectionOfCategory(category)].href}/${slug}`
}

export function eventPageHref(
  category: BusinessCategory,
  slug: string,
  path: string,
) {
  return `${eventHref(category, slug)}/${path}`
}

/**
 * 노션 페이지 ID를 대시가 있는 소문자 UUID로 맞춘다. 노션 주소에는 대시 없는
 * 32자리 형태도 쓰이므로 둘 다 받는다. UUID가 아니면 null.
 */
export function normalizeNotionId(value: string): string | null {
  const hex = value.toLowerCase().replace(/-/g, '')
  if (!/^[0-9a-f]{32}$/.test(hex)) {
    return null
  }
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDay(date: dayjs.Dayjs, withYear: boolean) {
  const day = `${date.month() + 1}월 ${date.date()}일 (${WEEKDAYS[date.day()]})`
  return withYear ? `${date.year()}년 ${day}` : day
}

/**
 * 행사 일시를 사람이 읽는 형태로 만든다.
 *
 * - 날짜만: 2026년 4월 18일 (토) ~ 4월 19일 (일)
 * - 시각까지: 2026년 2월 23일 (월) 14:00 ~ 2월 24일 (화) 19:00
 *
 * 같은 해면 끝 날짜의 연도를, 같은 날이면 끝 날짜 자체를 생략한다.
 */
export function formatEventPeriod(
  startDate: Date,
  endDate: Date,
  hasTime: boolean,
) {
  const start = dayjs(startDate).tz(TZ)
  const end = dayjs(endDate).tz(TZ)
  const sameDay = start.format('YYYY-MM-DD') === end.format('YYYY-MM-DD')
  const sameYear = start.year() === end.year()

  if (!hasTime) {
    const head = formatDay(start, true)
    return sameDay ? head : `${head} ~ ${formatDay(end, !sameYear)}`
  }

  const head = `${formatDay(start, true)} ${start.format('HH:mm')}`
  if (sameDay) {
    return `${head} ~ ${end.format('HH:mm')}`
  }
  return `${head} ~ ${formatDay(end, !sameYear)} ${end.format('HH:mm')}`
}

/** 목록에 쓰는 짧은 기간 표기. 예) 2026.04.18. - 04.19. */
export function formatEventPeriodShort(startDate: Date, endDate: Date) {
  const start = dayjs(startDate).tz(TZ)
  const end = dayjs(endDate).tz(TZ)
  const head = start.format('YYYY.MM.DD.')
  if (start.format('YYYY-MM-DD') === end.format('YYYY-MM-DD')) {
    return head
  }
  return `${head} - ${end.format(start.year() === end.year() ? 'MM.DD.' : 'YYYY.MM.DD.')}`
}

/**
 * 관리자 폼의 날짜(YYYY-MM-DD)와 선택 시각(HH:mm)을 저장할 순간으로 바꾼다.
 *
 * 시각이 없으면 기존 '사업' 데이터와 같이 UTC 자정으로 저장한다. 시각이 있으면
 * 한국 시각으로 해석한다.
 */
export function toEventInstant(dateValue: string, timeValue: string | null) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다.')
  }
  if (!timeValue) {
    return new Date(`${dateValue}T00:00:00.000Z`)
  }
  if (!/^\d{2}:\d{2}$/.test(timeValue)) {
    throw new Error('시각은 HH:mm 형식이어야 합니다.')
  }
  return dayjs.tz(`${dateValue}T${timeValue}`, TZ).toDate()
}

/** 저장된 순간을 관리자 폼의 날짜/시각 값으로 되돌린다. */
export function fromEventInstant(date: Date, hasTime: boolean) {
  if (!hasTime) {
    return { date: dayjs(date).utc().format('YYYY-MM-DD'), time: '' }
  }
  const local = dayjs(date).tz(TZ)
  return { date: local.format('YYYY-MM-DD'), time: local.format('HH:mm') }
}

/** 노션 아이콘이 이모지가 아니라 이미지 주소인지 판별한다. */
export function isImageIcon(icon: string | null | undefined): icon is string {
  return Boolean(icon && /^(https:\/\/|\/)/.test(icon))
}

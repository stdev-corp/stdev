import { describe, expect, it } from 'vitest'
import {
  CATEGORY_LABELS,
  EVENT_SECTIONS,
  RESERVED_SLUGS,
  ROLE_LABELS,
  ROLE_ORDER,
  eventHref,
  eventPageHref,
  formatEventPeriod,
  formatEventPeriodShort,
  fromEventInstant,
  isEventSection,
  isImageIcon,
  isValidPagePath,
  isValidSlug,
  normalizeNotionId,
  sectionOfCategory,
  toEventInstant,
} from '@/utils/events'
import { Links } from '@/utils/links'

describe('events', () => {
  describe('constants', () => {
    it('구역 두 개가 메뉴 주소와 카테고리를 갖는다', () => {
      expect(EVENT_SECTIONS.hackathon).toEqual({
        label: '해커톤&아이디어톤',
        href: Links.hackathon,
        newsHref: Links.hackathonNews,
        blogHref: Links.hackathonBlog,
        categories: ['hackathon', 'ideathon'],
      })
      expect(EVENT_SECTIONS.conference).toEqual({
        label: '컨퍼런스&프로그램',
        href: Links.conference,
        newsHref: Links.conferenceNews,
        blogHref: Links.conferenceBlog,
        categories: ['conference', 'program'],
      })
    })

    it('카테고리 이름표', () => {
      expect(CATEGORY_LABELS).toEqual({
        hackathon: '해커톤',
        ideathon: '아이디어톤',
        conference: '컨퍼런스',
        program: '프로그램',
      })
    })

    it('역할은 주최 → 주관 → 후원 → 협력 순서로 보인다', () => {
      expect(ROLE_ORDER).toEqual(['host', 'organizer', 'sponsor', 'partner'])
      expect(ROLE_ORDER.map((role) => ROLE_LABELS[role])).toEqual([
        '주최',
        '주관',
        '후원',
        '협력',
      ])
    })

    it('news와 blog는 예약된 슬러그다', () => {
      expect(RESERVED_SLUGS).toEqual(['news', 'blog'])
    })
  })

  describe('sectionOfCategory', () => {
    it('해커톤과 아이디어톤은 hackathon 구역', () => {
      expect(sectionOfCategory('hackathon')).toBe('hackathon')
      expect(sectionOfCategory('ideathon')).toBe('hackathon')
    })

    it('컨퍼런스와 프로그램은 conference 구역', () => {
      expect(sectionOfCategory('conference')).toBe('conference')
      expect(sectionOfCategory('program')).toBe('conference')
    })
  })

  describe('isEventSection', () => {
    it('두 구역 이름만 받아들인다', () => {
      expect(isEventSection('hackathon')).toBe(true)
      expect(isEventSection('conference')).toBe(true)
    })

    it('카테고리 이름이나 다른 값은 구역이 아니다', () => {
      expect(isEventSection('ideathon')).toBe(false)
      expect(isEventSection('program')).toBe(false)
      expect(isEventSection('news')).toBe(false)
      expect(isEventSection('')).toBe(false)
      expect(isEventSection('Hackathon')).toBe(false)
    })
  })

  describe('isValidSlug', () => {
    it.each(['dsf26', 'dsf-26', 'a', '2026', 'stdev-hack-2026', 'newsletter'])(
      '%s는 올바른 슬러그',
      (value) => {
        expect(isValidSlug(value)).toBe(true)
      },
    )

    it.each([
      '',
      'DSF26',
      'dsf_26',
      '-dsf',
      'dsf-',
      'dsf--26',
      'dsf 26',
      'dsf/26',
      '해커톤',
    ])('%j는 슬러그로 쓸 수 없다', (value) => {
      expect(isValidSlug(value)).toBe(false)
    })

    it('구역의 고정 페이지와 겹치는 news, blog는 막는다', () => {
      expect(isValidSlug('news')).toBe(false)
      expect(isValidSlug('blog')).toBe(false)
    })

    it.each([
      '123456781234123412341234567890ab',
      '12345678-1234-1234-1234-1234567890ab',
      '3053ff07ff5b80d6a7c3f5d8e7e0a0b1',
    ])('옛 노션 주소 처리와 겹치는 노션 ID 모양 %s는 막는다', (value) => {
      expect(isValidSlug(value)).toBe(false)
    })

    it('노션 ID보다 짧거나 16진수가 아닌 32자 슬러그는 쓸 수 있다', () => {
      expect(isValidSlug('123456781234123412341234567890a')).toBe(true)
      expect(isValidSlug('123456781234123412341234567890ag')).toBe(true)
    })
  })

  describe('isValidPagePath', () => {
    it.each(['faq', 'notice', 'notice/team-building', 'a/b/c', 'day-1/room-2'])(
      '%s는 올바른 하위 경로',
      (value) => {
        expect(isValidPagePath(value)).toBe(true)
      },
    )

    it.each([
      '',
      '/faq',
      'faq/',
      'notice//team',
      'FAQ',
      'notice/Team',
      'faq_1',
      'notice/-x',
      'notice/../x',
    ])('%j는 하위 경로로 쓸 수 없다', (value) => {
      expect(isValidPagePath(value)).toBe(false)
    })

    it('news, blog도 하위 경로로는 쓸 수 있다', () => {
      expect(isValidPagePath('news')).toBe(true)
      expect(isValidPagePath('blog')).toBe(true)
    })
  })

  describe('eventHref / eventPageHref', () => {
    it('카테고리에 따라 구역 주소 아래에 슬러그를 붙인다', () => {
      expect(eventHref('hackathon', 'dsf26')).toBe('/hackathon/dsf26')
      expect(eventHref('ideathon', 'idea25')).toBe('/hackathon/idea25')
      expect(eventHref('conference', 'conf26')).toBe('/conference/conf26')
      expect(eventHref('program', 'camp')).toBe('/conference/camp')
    })

    it('하위 페이지 경로를 행사 주소 뒤에 붙인다', () => {
      expect(eventPageHref('hackathon', 'dsf26', 'faq')).toBe(
        '/hackathon/dsf26/faq',
      )
      expect(eventPageHref('ideathon', 'idea25', 'notice/team')).toBe(
        '/hackathon/idea25/notice/team',
      )
      expect(eventPageHref('conference', 'conf26', 'program')).toBe(
        '/conference/conf26/program',
      )
      expect(eventPageHref('program', 'camp', 'a/b')).toBe(
        '/conference/camp/a/b',
      )
    })
  })

  describe('normalizeNotionId', () => {
    it('대시 없는 32자리 ID를 대시 있는 UUID로 바꾼다', () => {
      expect(normalizeNotionId('1b83ff07ff5b8051810eea2915cdc850')).toBe(
        '1b83ff07-ff5b-8051-810e-ea2915cdc850',
      )
    })

    it('대문자와 대시가 섞인 ID도 소문자 UUID로 맞춘다', () => {
      expect(normalizeNotionId('17E3FF07-FF5B-81CB-9285-C5A141C41055')).toBe(
        '17e3ff07-ff5b-81cb-9285-c5a141c41055',
      )
      expect(normalizeNotionId('17e3ff07ff5b-81cb9285c5a1-41c41055')).toBe(
        '17e3ff07-ff5b-81cb-9285-c5a141c41055',
      )
    })

    it.each([
      '',
      'dsf26',
      '1b83ff07ff5b8051810eea2915cdc85',
      '1b83ff07ff5b8051810eea2915cdc8500',
      '1b83ff07ff5b8051810eea2915cdc85g',
      'STDev-1b83ff07ff5b8051810eea2915cdc850',
    ])('%j는 노션 ID가 아니다', (value) => {
      expect(normalizeNotionId(value)).toBeNull()
    })
  })

  describe('formatEventPeriod', () => {
    describe('날짜만 (hasTime=false)', () => {
      it('같은 날이면 끝 날짜를 생략한다', () => {
        expect(
          formatEventPeriod(
            new Date('2026-04-18T00:00:00Z'),
            new Date('2026-04-18T00:00:00Z'),
            false,
          ),
        ).toBe('2026년 4월 18일 (토)')
      })

      it('같은 해면 끝 날짜의 연도를 생략한다', () => {
        expect(
          formatEventPeriod(
            new Date('2026-04-18T00:00:00Z'),
            new Date('2026-04-19T00:00:00Z'),
            false,
          ),
        ).toBe('2026년 4월 18일 (토) ~ 4월 19일 (일)')
      })

      it('해가 바뀌면 끝 날짜에도 연도를 쓴다', () => {
        expect(
          formatEventPeriod(
            new Date('2025-12-31T00:00:00Z'),
            new Date('2026-01-01T00:00:00Z'),
            false,
          ),
        ).toBe('2025년 12월 31일 (수) ~ 2026년 1월 1일 (목)')
      })
    })

    describe('시각까지 (hasTime=true)', () => {
      it('같은 날이면 끝은 시각만 쓴다 (한국 시각)', () => {
        expect(
          formatEventPeriod(
            new Date('2026-02-23T05:00:00Z'),
            new Date('2026-02-23T10:00:00Z'),
            true,
          ),
        ).toBe('2026년 2월 23일 (월) 14:00 ~ 19:00')
      })

      it('같은 해 다른 날이면 끝 날짜에서 연도만 뺀다', () => {
        expect(
          formatEventPeriod(
            new Date('2026-02-23T05:00:00Z'),
            new Date('2026-02-24T10:00:00Z'),
            true,
          ),
        ).toBe('2026년 2월 23일 (월) 14:00 ~ 2월 24일 (화) 19:00')
      })

      it('해가 바뀌면 끝 날짜에 연도를 쓴다', () => {
        expect(
          formatEventPeriod(
            new Date('2025-12-31T05:00:00Z'),
            new Date('2025-12-31T17:00:00Z'),
            true,
          ),
        ).toBe('2025년 12월 31일 (수) 14:00 ~ 2026년 1월 1일 (목) 02:00')
      })

      it('UTC로는 다른 날이어도 한국 시각으로 같은 날이면 같은 날로 본다', () => {
        // 2026-02-23 01:00 KST ~ 2026-02-23 19:00 KST
        expect(
          formatEventPeriod(
            new Date('2026-02-22T16:00:00Z'),
            new Date('2026-02-23T10:00:00Z'),
            true,
          ),
        ).toBe('2026년 2월 23일 (월) 01:00 ~ 19:00')
      })
    })
  })

  describe('formatEventPeriodShort', () => {
    it('같은 날이면 시작일만 쓴다', () => {
      expect(
        formatEventPeriodShort(
          new Date('2026-04-18T00:00:00Z'),
          new Date('2026-04-18T00:00:00Z'),
        ),
      ).toBe('2026.04.18.')
    })

    it('같은 해면 끝은 월.일만 쓴다', () => {
      expect(
        formatEventPeriodShort(
          new Date('2026-04-18T00:00:00Z'),
          new Date('2026-04-19T00:00:00Z'),
        ),
      ).toBe('2026.04.18. - 04.19.')
    })

    it('해가 바뀌면 끝에도 연도를 쓴다', () => {
      expect(
        formatEventPeriodShort(
          new Date('2025-12-31T00:00:00Z'),
          new Date('2026-01-01T00:00:00Z'),
        ),
      ).toBe('2025.12.31. - 2026.01.01.')
    })

    it('날짜는 한국 시각 기준이다', () => {
      // 2026-04-17T15:00Z == 2026-04-18 00:00 KST
      expect(
        formatEventPeriodShort(
          new Date('2026-04-17T15:00:00Z'),
          new Date('2026-04-18T14:59:00Z'),
        ),
      ).toBe('2026.04.18.')
    })
  })

  describe('toEventInstant', () => {
    it('시각이 없으면 UTC 자정으로 저장한다', () => {
      expect(toEventInstant('2026-04-18', null).toISOString()).toBe(
        '2026-04-18T00:00:00.000Z',
      )
      expect(toEventInstant('2026-04-18', '').toISOString()).toBe(
        '2026-04-18T00:00:00.000Z',
      )
    })

    it('시각이 있으면 한국 시각으로 해석한다', () => {
      expect(toEventInstant('2026-02-23', '14:00').toISOString()).toBe(
        '2026-02-23T05:00:00.000Z',
      )
      expect(toEventInstant('2026-02-23', '00:30').toISOString()).toBe(
        '2026-02-22T15:30:00.000Z',
      )
    })

    it.each(['2026-4-18', '2026/04/18', '', '20260418', 'tomorrow'])(
      '날짜 %j는 거부한다',
      (value) => {
        expect(() => toEventInstant(value, null)).toThrow(
          '날짜는 YYYY-MM-DD 형식이어야 합니다.',
        )
        expect(() => toEventInstant(value, '10:00')).toThrow(
          '날짜는 YYYY-MM-DD 형식이어야 합니다.',
        )
      },
    )

    it.each(['9:00', '14:00:00', '1400', 'noon'])(
      '시각 %j는 거부한다',
      (value) => {
        expect(() => toEventInstant('2026-02-23', value)).toThrow(
          '시각은 HH:mm 형식이어야 합니다.',
        )
      },
    )
  })

  describe('fromEventInstant', () => {
    it('시각이 없는 행사는 UTC 날짜를 쓰고 시각은 비운다', () => {
      expect(fromEventInstant(new Date('2026-04-18T00:00:00Z'), false)).toEqual(
        {
          date: '2026-04-18',
          time: '',
        },
      )
      // 한국 시각으로는 다음 날이어도 저장 규칙(UTC 자정)대로 읽는다.
      expect(fromEventInstant(new Date('2026-04-18T20:00:00Z'), false)).toEqual(
        {
          date: '2026-04-18',
          time: '',
        },
      )
    })

    it('시각이 있는 행사는 한국 날짜와 시각으로 되돌린다', () => {
      expect(fromEventInstant(new Date('2026-04-18T20:00:00Z'), true)).toEqual({
        date: '2026-04-19',
        time: '05:00',
      })
    })

    it('toEventInstant와 서로 되돌릴 수 있다', () => {
      expect(
        fromEventInstant(toEventInstant('2026-02-23', '14:05'), true),
      ).toEqual({ date: '2026-02-23', time: '14:05' })
      expect(
        fromEventInstant(toEventInstant('2026-02-23', null), false),
      ).toEqual({ date: '2026-02-23', time: '' })
    })
  })

  describe('isImageIcon', () => {
    it('https 주소와 사이트 내부 경로는 이미지 아이콘이다', () => {
      expect(isImageIcon('https://example.com/icon.png')).toBe(true)
      expect(isImageIcon('/krds/img/icon.svg')).toBe(true)
    })

    it('이모지, http 주소, 빈 값은 이미지가 아니다', () => {
      expect(isImageIcon('💡')).toBe(false)
      expect(isImageIcon('http://example.com/icon.png')).toBe(false)
      expect(isImageIcon('icon.png')).toBe(false)
      expect(isImageIcon('')).toBe(false)
      expect(isImageIcon(null)).toBe(false)
      expect(isImageIcon(undefined)).toBe(false)
    })
  })
})

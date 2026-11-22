/*
 * 노션 페이지 → 행사·하위 페이지 대응표.
 *
 * 행사의 일시·장소·주최·주관·후원·협력은 각 노션 페이지의 '개요' 문구와 기존
 * 홈페이지의 행사 목록 이미지에 적힌 값을 옮긴 것이다. 원문에 없는 값은 비워
 * 둔다(관리자 화면에서 채운다).
 */
import type { BusinessCategory, BusinessRole } from '@/utils/cms-types'

/** 이관할 노션 루트: '사단법인 STDev'(event.stdev.kr)와 '사단법인 STDev (이전)'(SPARCS 시절) */
export const NOTION_ROOTS = [
  '1b83ff07-ff5b-8051-810e-ea2915cdc850',
  '17e3ff07-ff5b-81cb-9285-c5a141c41055',
]

export type PageMapping = {
  notionId: string
  path: string
  /** 노션 제목 대신 쓸 제목(데이터베이스 페이지 등) */
  title?: string
  children?: PageMapping[]
}

export type EventMapping = {
  slug: string | null
  code: string
  /** 노션 페이지가 없는 행사(목록 항목만)는 null */
  notionId: string | null
  /** 노션 제목 대신 쓸 이름. 없으면 노션 페이지 제목. */
  name?: string
  category: BusinessCategory
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  location: string
  roles: Partial<Record<BusinessRole, string[]>>
  /** 목록 요약. 기존 홈페이지 행사 목록 이미지의 문구와 사진. */
  summary?: { image?: string; markdown: string }
  pages: PageMapping[]
}

/** 옮기지 않는 페이지: SPARCS 동아리 소개, 기획팀원 모집, 본문이 없는 SKYST Hackathon */
export const EXCLUDED_PAGES = new Set([
  '17e3ff07-ff5b-8163-a644-f20719be3a31',
  '17e3ff07-ff5b-818e-9f60-e5eebfb044f6',
  '17e3ff07-ff5b-8125-bbe2-e413987e5596',
])

/**
 * SPARCS 스타트업 해커톤 2023 페이지에는 같은 공지가 두 벌씩 있다(복사본, 내용
 * 동일). 첫 벌만 옮기고 두 번째 벌의 링크는 뺀다.
 */
export const DUPLICATE_PAGES = new Set([
  '17e3ff07-ff5b-8139-99fa-dddf26437761',
  '17e3ff07-ff5b-81e7-b81b-fb1a352e3d37',
  '17e3ff07-ff5b-81d5-a4b4-dded38d3c70d',
  '17e3ff07-ff5b-8160-a596-f1ddb783549f',
  '17e3ff07-ff5b-8111-ab31-fdee4002eab9',
  '17e3ff07-ff5b-81b0-bf4f-d7ab3c1eb8aa',
  '17e3ff07-ff5b-81ef-8a31-d6523ddb48eb',
  '17e3ff07-ff5b-81e4-b3d6-ddaf714504ba',
])

/**
 * 참가자 개인정보(실명 명단)가 담긴 블록. 사용자 결정에 따라 이 블록만 빼고
 * '개인정보 보호를 위해 삭제' 안내로 바꾼다.
 */
export const REDACTED_BLOCKS = new Set([
  // SPARCS 서비스 해커톤 2024 > 참가자 대상 안내 > 숙소 방 배정: 이름·성별·방 번호 표
  '17e3ff07-ff5b-812e-bbf3-de4f6a1b3caa',
  // SPARCS AI 스타트업 해커톤 2024 > 숙소, 행사장 안내 > 방배정 표: 명단 표를 찍은 이미지
  '17e3ff07-ff5b-817d-b335-d0d615253362',
  // SPARCS 스타트업 해커톤 2023 > 채널톡 프로필 이름 변경 안내: 팀리더 성함 표
  '17e3ff07-ff5b-816b-87d1-d00eacfc0708',
  '17e3ff07-ff5b-81a3-be80-e507b3c9d77d',
])

/** 홈페이지 행사 목록 이미지에서 옮긴 요약 문구 */
const SUMMARY = {
  sh23: `2023년 1월 27일 (금) ~ 1월 29일 (일), 서울 영등포구 문래동 올댓마인드에서 진행

**투자&멘토링과 함께한 창업 중심 해커톤**

- 전국 대학생 기획자, 디자이너, 개발자 참여
- 광범위한 주제 제시
- VC 심사역&대표님의 멘토링
- AWS 자원 지원
- 해커톤 4주 후 최종 Demo Day 진행

**전국 대학생 96명을 대상으로 한 대회**

- 총 266개의 지원서 접수
- 서울대, 연세대, 고려대, 서강대, 성균관대, 한양대, 중앙대, 경희대, 한국외대, 서울시립대, KAIST, POSTECH, GIST, UNIST, DGIST 등 70여개 대학
- 96명의 참가자 선발`,
  ssh24: `2024년 2월 14일 (수) ~ 16일 (금), KAIST 본원 N1 빌딩 117호, 대전 이스포츠 경기장, 롯데시티호텔 대전에서 진행

대전광역시, KAIST 공동주최 / SPARCS 주관

엘리스, 루센트블록, 코아텍, 위메이드, KAIST 청년창업투자지주, 프라이머사제파트너스, 매쉬업벤처스 후원

**전국 대학생에게 SPARCS 소개 및 네트워킹 활성화를 위한 대회**

- SPARCS 의 활동 과정인 교육, 기획, 개발을 행사에 그대로 압축 및 재현
- 전국의 대학생들에게 대전시 및 KAIST 방문 기회 제공

**전국 대학생 80명을 대상으로 한 대회**

- 전국 20여개 대학에서 200명의 지원서 접수`,
  sash24: `2024년 7월 29일 (월) ~ 8월 1일 (목), 카이스트 본원에서 진행

**NAVER Cloud와 함께한 AI 창업 아이디어 해커톤**

- 전국 대학생 기획자, 디자이너, 개발자 참여
- 광범위한 주제 제시
- VC 심사역&대표님의 멘토링
- NAVER Cloud 크레딧 지원

**전국 대학생 총 120명을 대상으로 한 대회**

- 총 166개의 지원서 접수
- 서울대, 연세대, 고려대, 서강대, 성균관대, 한양대, KAIST, POSTECH, GIST, UNIST, DGIST 등 40여개 대학
- 120명의 참가자 선발
- 3박 4일 간 개발, 멘토링, 강연 등의 일정`,
  dsf24: `2024년 10월 19일 (토) ~ 10월 20일 (일), 대전 컨벤션 센터 제 1, 2 전시장에서 진행

**과학 관련 서비스 개발 해커톤**

- “SW로 풀어내는 과학”이라는 주제 제시
- 창의적인 과학 관련 서비스 아이디어 발굴 프로토타입 개발 기회 제공
- 일상생활의 물리 현상을 시각화하는 과학 교육 서비스, 치매 환자와 보호자를 위한 AI 기억 관리 플랫폼, 실생활 과학 문제 해결을 위한 AI 시뮬레이션 학습 게임 등의 산출물

**대전 사이언스 페스티벌 부대 행사로 진행**

- 주최 대전광역시, 대전관광공사 / 주관 SPARCS
- 사이언스 페스티벌에 참여한 대중들에게 부스를 시연할 수 있는 기회 제공

**전국의 고등학생, 대학생 72명을 대상으로 한 대회**`,
  hellothon24: `2024년 11월 10일 (일) ~ 11월 24일 (일), 대면 일정 엘리스 랩 성수에서 진행, 2주간 팀별 비대면 개발 진행

**공모전 형식의 장기 행사로 양질의 산출물 유도**

- 11.10. (일) Meet up Day로 팀 별 아이데이션 및 아이스브레이킹 진행
- 이후 2주간 팀 별 비대면 개발, 해당 기간 동안 운영진 모니터링
- 11.23. (토) ~ 11.24. (일) 무박 2일 대면 해커톤 이후 산출물 제출
- Elice cloud, ML API 제공

**현직자부터 고등학생까지 넓은 참가자 풀**

- 재직/재학 여부 무관하게 전국 개발자, 기획자, 디자이너 48인 선발
- 다양한 배경과 경력을 가진 참가자 간의 네트워킹

**“AI에 마음을 담다"라는 주제로, 유의미한 AI 서비스에 대한 인사이트 제시**

- 사회복지사의 인지 교육을 보조하기 위한 AI 서비스, 자기소개서 작성을 보조하는 서비스, 인스타그램 댓글 관리 서비스 등`,
  skyst23: `2023년 11월 12일 (일), KAIST 서울캠퍼스 1호관 대강당, 김동명 강의실에서 진행

**서울대, 연세대, 고려대, KAIST 연합 Tech&Career 컨퍼런스**

- 총 28개의 테크, 커리어, 단체 소개 세션 그리고 채용설명회
- 4개 주최 단체, 7개 파트너 단체, 6개 후원사

**4개 학교 재학/휴학/졸업생 220명 대상**

**SPARCS 주요 서비스 PM 발표 세션 진행**

- 조유민 OTL PM: KAIST 대표 서비스 OTL의 PM은 디자인을 한다
- 오승빈 OTL TL: 수강신청 기간을 버텨라: AWS 아키텍처 개선 스토리
- 정동진 선배님: 블록체인 MEV 서쳐가 되기까지`,
}

export const EVENTS: EventMapping[] = [
  {
    slug: 'dsf26',
    code: 'dsf26',
    notionId: '32d3ff07-ff5b-8001-ae54-c458f8571ea3',
    category: 'hackathon',
    startDate: '2026-04-18',
    endDate: '2026-04-19',
    location: '대전컨벤션센터(DCC) 제2전시장 301호',
    roles: {},
    pages: [
      { notionId: '32d3ff07-ff5b-802e-9590-d11a59608612', path: 'faq' },
      { notionId: '32d3ff07-ff5b-8036-b482-f8b4bc27da00', path: 'apply' },
      { notionId: '32d3ff07-ff5b-8066-9d79-ce13491bc0cb', path: 'agreement' },
      { notionId: '33c3ff07-ff5b-806d-8dd1-f58721f4e44b', path: 'notice' },
    ],
  },
  {
    slug: 'ssi26',
    code: 'ssi26',
    notionId: '3053ff07-ff5b-80d2-8f20-e1ef63727091',
    category: 'ideathon',
    startDate: '2026-02-23',
    endDate: '2026-02-24',
    startTime: '14:00',
    endTime: '19:00',
    location: 'KAIST 본원',
    roles: {
      host: ['KAIST'],
      organizer: ['사단법인 STDev'],
      sponsor: [
        '카카오벤처스',
        '프라이머사제파트너스',
        '카이스트청년창업투자지주',
      ],
    },
    pages: [
      // Oopy에서 슬러그 없이 노션 ID 주소로만 열리던 두 페이지
      { notionId: '3053ff07-ff5b-81bd-8cff-c7b08d02f978', path: 'apply' },
      { notionId: '3053ff07-ff5b-8065-b678-e0c67a47c806', path: 'agreement' },
      { notionId: '30d3ff07-ff5b-80ba-a58b-f480a57bc254', path: 'notice' },
    ],
  },
  {
    slug: 'dsf25',
    code: 'dsf25',
    notionId: '1b83ff07-ff5b-804e-9f14-f05f372fad50',
    category: 'hackathon',
    startDate: '2025-04-19',
    endDate: '2025-04-20',
    location: '대전컨벤션센터(DCC) 제1전시장 204, 205호',
    roles: {},
    pages: [
      { notionId: '1b83ff07-ff5b-80f5-bc2e-d8d663f6bf0f', path: 'faq' },
      { notionId: '1b83ff07-ff5b-8057-9241-e96d9d80a51b', path: 'applynow' },
      { notionId: '1b83ff07-ff5b-8083-a03c-d18acd4dabfb', path: 'agreement' },
      { notionId: '1d73ff07-ff5b-8047-83e5-d9ff3a47afe6', path: 'notice' },
    ],
  },
  {
    slug: 'm24w',
    code: 'm24w',
    notionId: '17e3ff07-ff5b-811f-8751-fbd20675736e',
    category: 'program',
    startDate: '2024-12-23',
    // 인턴십 활동(~3/21) 다음 날의 최종 성과 발표까지
    endDate: '2025-03-22',
    location: '비대면',
    roles: {
      organizer: ['SPARCS'],
      sponsor: ['카카오벤처스', '프라이머사제파트너스'],
    },
    pages: [
      { notionId: '17e3ff07-ff5b-8164-aa61-d89f77c0d2d7', path: 'companies' },
      { notionId: '17e3ff07-ff5b-8127-b2e0-ea6809d2b522', path: 'agreement' },
    ],
  },
  {
    slug: null,
    code: 'hellothon24',
    notionId: null,
    name: 'AI Hellothon 2024',
    category: 'hackathon',
    startDate: '2024-11-10',
    endDate: '2024-11-24',
    location: '엘리스 랩 성수',
    roles: {},
    summary: { image: 'hellothon24-recap.jpg', markdown: SUMMARY.hellothon24 },
    pages: [],
  },
  {
    slug: 'dsf24',
    code: 'dsf24',
    notionId: '17e3ff07-ff5b-81d6-875e-ecf3ef4c6bfe',
    category: 'hackathon',
    startDate: '2024-10-19',
    endDate: '2024-10-20',
    startTime: '13:00',
    endTime: '17:30',
    location: '대전컨벤션센터 제1전시장 204호, 205호',
    roles: {
      host: ['대전광역시', '대전관광공사'],
      organizer: ['SPARCS'],
      sponsor: [
        '쎄트렉아이',
        '래블업',
        '호랑에듀',
        '알고릭스',
        '대전정보문화산업진흥원',
      ],
    },
    summary: { image: 'dsf24-recap.jpg', markdown: SUMMARY.dsf24 },
    pages: [
      { notionId: '17e3ff07-ff5b-817d-9336-f108253a8a31', path: 'apply' },
      { notionId: '17e3ff07-ff5b-81a1-937b-d3af4aac1907', path: 'faq' },
      { notionId: '17e3ff07-ff5b-8106-a52b-dc95c890b422', path: 'agreement' },
      {
        notionId: '17e3ff07-ff5b-817b-8862-dad3b05b60d7',
        path: 'guide',
        children: [
          {
            notionId: '17e3ff07-ff5b-8110-9771-e2ae3742537d',
            path: 'guide/team-building',
          },
          {
            notionId: '17e3ff07-ff5b-81e9-8970-de7c0ae35c5f',
            path: 'guide/schedule',
          },
          {
            notionId: '17e3ff07-ff5b-8107-96bc-e604278798f4',
            path: 'guide/venue',
          },
          {
            notionId: '17e3ff07-ff5b-81a9-a60b-df676cdc608b',
            path: 'guide/meals',
          },
          {
            notionId: '17e3ff07-ff5b-8166-9dda-c3d714223867',
            path: 'guide/judging',
          },
        ],
      },
      { notionId: '17e3ff07-ff5b-81c0-98ab-dd8f11675b79', path: 'reviews' },
    ],
  },
  {
    slug: 'sash24',
    code: 'sash24',
    notionId: '17e3ff07-ff5b-81f6-9563-e735eb14247b',
    category: 'hackathon',
    startDate: '2024-07-29',
    endDate: '2024-08-01',
    startTime: '13:00',
    endTime: '18:30',
    location: 'KAIST 본원',
    roles: {
      host: ['KAIST', '대전광역시'],
      organizer: ['SPARCS', 'KAIST SW 교육센터'],
      sponsor: [
        'NAVER Cloud',
        '프라이머사제파트너스',
        '매쉬업벤처스',
        '카카오벤처스',
        'Krew Capital',
      ],
      partner: ['대전정보문화산업진흥원'],
    },
    summary: { image: 'ash24-recap.jpg', markdown: SUMMARY.sash24 },
    pages: [
      { notionId: '17e3ff07-ff5b-8151-a993-cafbe4267edb', path: 'notice-1' },
      {
        notionId: '17e3ff07-ff5b-814e-af02-c8547526f07f',
        path: 'team-building',
      },
      { notionId: '17e3ff07-ff5b-815c-a07e-defc8288cb00', path: 'notice-2' },
      {
        notionId: '17e3ff07-ff5b-81e4-acb1-ee0fc007ebeb',
        path: 'naver-cloud',
        children: [
          {
            notionId: '17e3ff07-ff5b-81f7-bd57-d840e449e705',
            path: 'naver-cloud/credit',
          },
          {
            notionId: '17e3ff07-ff5b-8166-9f51-e0b74988cbf0',
            path: 'naver-cloud/clova-studio',
          },
          {
            notionId: '17e3ff07-ff5b-814f-877f-e8e01c111371',
            path: 'naver-cloud/tuning',
          },
          {
            notionId: '17e3ff07-ff5b-815b-a1a2-d53726993a71',
            path: 'naver-cloud/skills',
          },
          {
            notionId: '17e3ff07-ff5b-8170-af87-e298796e3f3a',
            path: 'naver-cloud/api',
          },
          {
            notionId: '17e3ff07-ff5b-8103-a386-c16bf1ea448e',
            path: 'naver-cloud/explorer',
          },
          {
            notionId: '17e3ff07-ff5b-8116-8d8d-ff944e8c96ce',
            path: 'naver-cloud/ai-filter',
          },
        ],
      },
      { notionId: '17e3ff07-ff5b-8126-9434-d12203683224', path: 'venue' },
      { notionId: '17e3ff07-ff5b-81d4-ab23-e94460219292', path: 'meals' },
      { notionId: '17e3ff07-ff5b-8153-a6c1-dfa6ac5b5ce9', path: 'amenities' },
      {
        notionId: '17e3ff07-ff5b-81d7-a204-c4fc1f0acb26',
        path: 'attendance-pass',
      },
      { notionId: '17e3ff07-ff5b-81df-8643-c353f0453992', path: 'day-4' },
      { notionId: '17e3ff07-ff5b-8120-91b0-e428cec0006c', path: 'apply' },
      { notionId: '17e3ff07-ff5b-816f-9a3b-c9efd8bcad71', path: 'interview' },
      { notionId: '17e3ff07-ff5b-817e-a814-c362d6cda307', path: 'faq' },
      { notionId: '17e3ff07-ff5b-8154-98ae-f655dcf1018e', path: 'agreement' },
      { notionId: '17e3ff07-ff5b-8156-b969-cdef28a40835', path: 'agreement-2' },
    ],
  },
  {
    slug: 'ssh24',
    code: 'ssh24',
    notionId: '17e3ff07-ff5b-81bf-bb7c-d525e0f3771e',
    category: 'hackathon',
    startDate: '2024-02-14',
    endDate: '2024-02-16',
    startTime: '13:00',
    endTime: '19:00',
    location: 'KAIST 본원 N1, 대전드림아레나, 롯데시티호텔 대전',
    roles: {
      host: ['대전광역시', 'KAIST'],
      organizer: ['SPARCS'],
      sponsor: [
        '엘리스',
        '루센트블록',
        '코아텍',
        '위메이드',
        '카이스트청년창업투자지주',
        '프라이머사제파트너스',
        '매쉬업벤처스',
      ],
    },
    summary: { image: 'ssh24-recap.jpg', markdown: SUMMARY.ssh24 },
    pages: [
      {
        notionId: '17e3ff07-ff5b-8160-94a2-c0e11fde2f3d',
        path: 'press',
        title: 'SPARCS 서비스 해커톤 2024 보도자료',
      },
      { notionId: '17e3ff07-ff5b-8141-83df-c6deac0c7ebb', path: 'reviews' },
      { notionId: '17e3ff07-ff5b-8166-9fe0-f1d3b90365ee', path: 'apply' },
      { notionId: '17e3ff07-ff5b-8192-b37c-f14ffd06fffa', path: 'interview' },
      { notionId: '17e3ff07-ff5b-81eb-94ed-d76028032a23', path: 'faq' },
      { notionId: '17e3ff07-ff5b-81a7-b781-f2969064499d', path: 'agreement' },
      {
        notionId: '17e3ff07-ff5b-8111-a97c-d957a9a759ed',
        path: 'guide',
        children: [
          {
            notionId: '17e3ff07-ff5b-8114-9177-f267970634fc',
            path: 'guide/hotel-activities',
          },
          {
            notionId: '17e3ff07-ff5b-81fc-8502-fb0ae4ac2cd8',
            path: 'guide/rooms',
          },
        ],
      },
    ],
  },
  {
    slug: 'skyst23',
    code: 'skyst23',
    notionId: '17e3ff07-ff5b-814e-b55a-fa894435a4a3',
    category: 'conference',
    startDate: '2023-11-12',
    endDate: '2023-11-12',
    startTime: '11:00',
    endTime: '18:00',
    location: 'KAIST 서울캠퍼스 대강당 & 김동명 강의실 (회기동)',
    roles: { organizer: ['SKYST'] },
    summary: { image: 'skyst23-recap.jpg', markdown: SUMMARY.skyst23 },
    pages: [
      // SKYST 연합 소개. 노션에서는 이 행사의 상위 페이지였다.
      { notionId: '17e3ff07-ff5b-8147-b8c0-fc5aa6bc537a', path: 'skyst' },
    ],
  },
  {
    slug: 'ssh23',
    code: 'ssh23',
    notionId: '17e3ff07-ff5b-81de-aaa1-dee533ba7306',
    category: 'hackathon',
    startDate: '2023-01-27',
    endDate: '2023-01-29',
    startTime: '17:00',
    endTime: '19:00',
    location: '서울 영등포구 문래로 55 2층 올댓마인드',
    roles: {
      sponsor: [
        'AWS Korea',
        '채널코퍼레이션',
        '보이저엑스',
        '쿼드마이너',
        '카펜스트리트',
        '코르카',
        '프라이머',
        '클라썸',
        'NAVER D2',
        '프라이머사제파트너스',
        '카이스트청년창업투자지주',
        '에이티넘인베스트먼트',
        '두나무앤파트너스',
      ],
    },
    summary: { image: 'sh23-recap.jpg', markdown: SUMMARY.sh23 },
    pages: [
      { notionId: '17e3ff07-ff5b-81eb-89e3-f8910c7fe5fd', path: 'reviews' },
      { notionId: '17e3ff07-ff5b-819b-892d-f4f04d097218', path: 'schedule' },
      { notionId: '17e3ff07-ff5b-8177-8100-eefd5683f42a', path: 'apply' },
      { notionId: '17e3ff07-ff5b-81a6-aca2-debddd81bd10', path: 'sponsors' },
      { notionId: '17e3ff07-ff5b-81e1-8568-d63bda98511c', path: 'faq' },
      { notionId: '17e3ff07-ff5b-812b-b0ea-e9d5b505389a', path: 'agreement' },
      {
        notionId: '17e3ff07-ff5b-818d-abf0-e3287f6a4cdd',
        path: 'primer-guide',
      },
      {
        notionId: '17e3ff07-ff5b-812d-a1b6-c0982f96d8bf',
        path: 'announcement',
      },
      { notionId: '17e3ff07-ff5b-8183-85a4-db1026537bd2', path: 'channeltalk' },
      {
        notionId: '17e3ff07-ff5b-81e9-a9bc-e349e2ceabac',
        path: 'channeltalk-profile',
      },
      {
        notionId: '17e3ff07-ff5b-81e1-a5b5-d92d2978b4d0',
        path: 'team-building',
      },
      { notionId: '17e3ff07-ff5b-81be-82de-d6099386cb66', path: 'theme' },
      { notionId: '17e3ff07-ff5b-8145-b527-e73424fb6dd5', path: 'cloud' },
      { notionId: '17e3ff07-ff5b-81e3-b88b-e1e301c6569f', path: 'github' },
      { notionId: '17e3ff07-ff5b-8199-bb63-ed17810f574f', path: 'submission' },
    ],
  },
]

/**
 * 노션에 적힌 기관 이름 → 운영 DB에 이미 있는 같은 기관의 국문명. 가져오기는 먼저
 * 노션 이름으로, 없으면 이 이름으로 기존 기관을 찾고, 둘 다 없을 때만 새로 만든다.
 * (운영 DB는 영문명이나 띄어쓰기만 다르게 같은 기관을 이미 갖고 있다.)
 */
export const INSTITUTION_ALIASES: Record<string, string> = {
  KAIST: '카이스트',
  'KAIST SW 교육센터': 'KAIST SW교육센터',
  'Krew Capital': '크루캐피탈',
  'NAVER Cloud': '네이버 클라우드',
  'NAVER D2': '네이버 D2',
  'AWS Korea': 'AWS',
  프라이머사제파트너스: '사제파트너스',
}

/** 새로 만드는 기관의 홈페이지 주소(노션 본문에 적혀 있던 것) */
export const INSTITUTION_URLS: Record<string, string> = {
  KAIST: 'https://www.kaist.ac.kr',
  대전광역시: 'https://www.daejeon.go.kr',
}

/** 구역 소개: 기존 /business/hackathon, /business/conference 페이지의 문구 */
export const SECTION_INTROS = {
  hackathon: `STDev는 참가자들에게 단기간 프로젝트를 통한 성장과 개발자 간의 네트워킹을 위해, 꾸준히 해커톤을 주최해왔습니다.

# STDev Hackathon Vision

## 지속 가능성

해커톤이 끝나고 난 후에도, 개발한 프로젝트를 창업 또는 개인 프로젝트로 고도화 시킬 수 있는 지속 가능한 프로젝트의 탄생을 추구합니다.\\
이를 위해 Demo day, 부스 심사를 통한 산출물에 대한 심층적 피드백, VC 연결 지원 등 다양한 시도를 해왔습니다.

## 네트워크 형성

STDev는 해커톤을 통해 참가자들에게 개발 실력의 성장 뿐 아니라, 새로운 팀원과의 협업을 통한 네트워크 형성의 경험을 제공하고자 합니다.\\
실제 참가자들로부터 이전 해커톤의 팀빌딩과 네트워킹 경험에 대해 긍정적인 피드백을 얻었습니다.\\
양질의 네트워킹 경험을 제공하기 위해, 참가자 선발부터 팀 빌딩까지 협업 시에 기대되는 팀원 간 시너지 효과를 가장 우선 순위에 두어 참가자 매니징을 진행하고 있습니다.

## 개발자 중심 기획

행사를 기획하는 인원이 개발자임을 바탕으로, STDev의 해커톤은 개발자의 시각에서 양질의 개발 환경, 개발자에게 필요한 지원을 하는 운영진이 되도록 노력하고 있습니다.\\
개발 플랫폼을 운영하는 기업의 후원을 통해 API를 제공하거나, 원활한 개발을 위한 IT 지원을 진행하는 등 최상의 개발 경험을 제공하기 위해 기획 단계부터 운영까지 최선을 다하고 있습니다.`,
  conference:
    'STDev는 개발자 간 네트워킹을 증진하고, 상호 교류를 통한 인사이트를 제공하기 위해 컨퍼런스를 진행하고 있습니다.',
}

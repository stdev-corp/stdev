/*
 * 행사 목록(/hackathon/news, /hackathon/blog)에 올릴 언론 기사와 참가자 후기.
 *
 * 노션에서는 행사 하위 페이지(SSH24 보도자료 표, SSH23·SSH24·DSF24 참가 후기 북마크)에만
 * 있던 링크다. 2026-11-23에 링크마다 지금 페이지를 열어 제목, 언론사 또는 글쓴이, 처음
 * 게시한 날(한국 시간), 정식 https 주소를 확인했다. 노션 표의 약칭은 언론사 공식 이름으로
 * 바꿨다(뉴스원 → 뉴스1, 한국금융 → 한국금융신문, 대전시 → 대전광역시).
 *
 * 공개 목록은 https 주소만 보여 주므로 다음 링크는 넣지 않았다.
 * - 교육사랑신문 '카이스트와 전국 대학생 공공 데이터 해커톤 대회 공동 개최'(2024-02-17):
 *   http로만 열리고 https는 인증서가 만료됐다.
 *   http://www.edulove.net/news/articleView.html?idxno=32096
 * - vroomfan.tistory.com/66 'SPARCS 2023 StartUp Hackathon 준우승 수상 후기': 블로그가 없어졌다.
 * - www.yuksamgak.com/my-alchemy: 도메인에 웹 서버가 없다.
 */

export type WebpageEntry = {
  type: 'news_article' | 'blog_post'
  /** 연결할 행사의 슬러그(mapping.ts EVENTS) */
  event: string
  title: string
  /** 뉴스 기사는 언론사, 후기는 글쓴이 */
  author: string
  url: string
  /** 처음 게시한 날(한국 시간), YYYY-MM-DD */
  publishedDate: string
}

export const WEBPAGE_LABELS: Record<WebpageEntry['type'], string> = {
  news_article: '뉴스 기사',
  blog_post: '참여후기',
}

export const WEBPAGES: WebpageEntry[] = [
  /* SPARCS 서비스 해커톤 2024 언론 기사 */
  {
    type: 'news_article',
    event: 'ssh24',
    title: '루센트블록, 대전시-카이스트 주최 ‘대학생 해커톤’ 후원',
    author: '한국금융신문',
    url: 'https://www.fntimes.com/html/view.php?ud=2024021308593490045e6e69892f_18',
    publishedDate: '2024-02-13',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title: '루센트블록, 카이스트 개발자 해커톤 지원…"멘토링·채용 정보 제공"',
    author: '뉴스1',
    url: 'https://www.news1.kr/finance/blockchain-fintech/5318813',
    publishedDate: '2024-02-13',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title: '루센트블록, ‘SPARCS 서비스 해커톤 2024’ 후원사로 참여',
    author: '벤처스퀘어',
    url: 'https://www.venturesquare.net/913347/',
    publishedDate: '2024-02-13',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title: '카이스트와 전국 대학생 공공 데이터 해커톤 대회 공동 개최',
    author: '세종의아침',
    url: 'https://www.sjmorning.kr/news/articleView.html?idxno=703',
    publishedDate: '2024-02-17',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title:
      '공공 데이터 기반 사회문제 해결…대전시, 카이스트와 전국 대학생 해커톤 대회',
    author: '충남일보',
    url: 'https://www.chungnamilbo.co.kr/news/articleView.html?idxno=757318',
    publishedDate: '2024-02-17',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title: '카이스트와 전국 대학생 공공 데이터 해커톤 대회 공동 개최',
    author: '신아일보',
    url: 'https://www.shinailbo.co.kr/news/articleView.html?idxno=1829924',
    publishedDate: '2024-02-17',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title: '대전시-카이스트, 전국 대학생 공공 데이터 해커톤 대회 공동 개최',
    author: '전국매일신문',
    url: 'https://www.jeonmae.co.kr/news/articleView.html?idxno=1015062',
    publishedDate: '2024-02-18',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title: '카이스트와 전국 대학생 공공 데이터 해커톤 대회 공동 개최',
    author: '대전투데이',
    url: 'https://www.daejeontoday.com/news/articleView.html?idxno=673412',
    publishedDate: '2024-02-18',
  },
  {
    // 노션 표의 주소(boardId만 있는 것)는 빈 게시판 화면을 보여 줘 글 번호를 붙였다.
    type: 'news_article',
    event: 'ssh24',
    title: '카이스트와 전국 대학생 공공 데이터 해커톤 대회 공동 개최',
    author: '대전광역시',
    url: 'https://www.daejeon.go.kr/drh/board/boardNormalView.do?boardId=normal_0189&menuSeq=1632&ntatcSeq=1448869655',
    publishedDate: '2024-02-19',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title: '카이스트와 전국 대학생 공공 데이터 해커톤 대회 공동 개최',
    author: '농어업경제귀농신문',
    url: 'https://www.knongnews.com/news/articleView.html?idxno=18639',
    publishedDate: '2024-02-20',
  },
  {
    type: 'news_article',
    event: 'ssh24',
    title: '성공리에 개최된 SPARCS 서비스 해커톤 2024, 그 자세한 내막을 묻다',
    author: '카이스트신문',
    url: 'https://times.kaist.ac.kr/news/articleView.html?idxno=21606',
    publishedDate: '2024-03-05',
  },

  /* SPARCS 스타트업 해커톤 2023 참가 후기 */
  {
    type: 'blog_post',
    event: 'ssh23',
    title: 'SPARCS 2023 StartUp Hackathon 참여 후기',
    author: 'mopil',
    url: 'https://mopil.tistory.com/entry/SPARCS-2023-StartUp-Hackathon-%EC%B0%B8%EC%97%AC-%ED%9B%84%EA%B8%B0',
    publishedDate: '2023-01-30',
  },
  {
    type: 'blog_post',
    event: 'ssh23',
    title: 'SPARCS 2023 StartUp Hackathon 참여 후기',
    author: '귀염둥이 팡무',
    url: 'https://holykisa.tistory.com/86',
    publishedDate: '2023-02-03',
  },
  {
    type: 'blog_post',
    event: 'ssh23',
    title: '해커톤 참가 후기 (SPARCS 2023 StartUp Hackathon)',
    author: '이재찬',
    url: 'https://dlwocks31.me/blog/sparcs-hackathon/',
    publishedDate: '2023-02-04',
  },
  {
    type: 'blog_post',
    event: 'ssh23',
    title: 'SPARCS 해커톤 참가 후기',
    author: '구름뭉치',
    url: 'https://ws-pace.tistory.com/266',
    publishedDate: '2023-02-04',
  },

  /* SPARCS 서비스 해커톤 2024 참가 후기 */
  {
    type: 'blog_post',
    event: 'ssh24',
    title: '[회고] SPARCS 2024 Service Hackathon',
    author: '유재영',
    url: 'https://velog.io/@jackyu0721/%ED%9A%8C%EA%B3%A0-SPARCS-2024-Service-Hackathon',
    publishedDate: '2024-02-17',
  },
  {
    type: 'blog_post',
    event: 'ssh24',
    title: '[리뷰] SPARCS Service Hackathon 2024 참가 후기 - 최우수상 수상!',
    author: 'r4bb1t',
    url: 'https://r4bb1t.tistory.com/117',
    publishedDate: '2024-02-18',
  },
  {
    type: 'blog_post',
    event: 'ssh24',
    title: 'LLM을 활용한 집 추천 시스템',
    author: 'Taewan Cho',
    url: 'https://taewan2002.medium.com/llm%EC%9D%84-%ED%99%9C%EC%9A%A9%ED%95%9C-%EC%A7%91-%EC%B6%94%EC%B2%9C-%EC%8B%9C%EC%8A%A4%ED%85%9C-6f22b677f3d6',
    publishedDate: '2024-02-18',
  },
  {
    type: 'blog_post',
    event: 'ssh24',
    title: '2024 SPARCS Hackathon 후기 (feat. 파티빵빵)',
    author: '해빈',
    url: 'https://velog.io/@h-beeen/2024-SPARCS-Hackathon-%ED%9B%84%EA%B8%B0-feat.-%ED%8C%8C%ED%8B%B0%EB%B9%B5%EB%B9%B5',
    publishedDate: '2024-02-20',
  },
  {
    type: 'blog_post',
    event: 'ssh24',
    title: '[해커톤] SPARCS 서비스 해커톤 2024 참가 및 최우수상 수상 후기',
    author: '민됴리',
    url: 'https://mindorizip.tistory.com/144',
    publishedDate: '2024-02-28',
  },
  {
    type: 'blog_post',
    event: 'ssh24',
    title: 'SPARCS 서비스 해커톤 2024 후기: 대상을 받다',
    author: '찬휘 (te6)',
    url: 'https://blog.te6.in/post/sparcs-service-hackathon-2024',
    publishedDate: '2024-03-03',
  },

  /* SPARCS 과학 해커톤 2024 참가 후기 */
  {
    type: 'blog_post',
    event: 'dsf24',
    title: 'SPARCS 해커톤 2024 참가 후기 대전 DCC',
    author: '나리',
    url: 'https://blog.naver.com/nanahee3/223627580649',
    publishedDate: '2024-10-21',
  },
  {
    type: 'blog_post',
    event: 'dsf24',
    title: '🔭SPARCS 과학 해커톤 2024 후기',
    author: '서희건',
    url: 'https://velog.io/@zeegun/SPARCS-%EA%B3%BC%ED%95%99-%ED%95%B4%EC%BB%A4%ED%86%A4-2024-%ED%9B%84%EA%B8%B0',
    publishedDate: '2024-10-23',
  },
  {
    type: 'blog_post',
    event: 'dsf24',
    title: '무박 2일 해커톤 참여 후기 - 대전에 다녀오다',
    author: '욘잔',
    url: 'https://blog.naver.com/duswls214/223638843572',
    publishedDate: '2024-10-29',
  },
  {
    type: 'blog_post',
    event: 'dsf24',
    title: '[해커톤] SPARCS 과학 해커톤 2024 참가 후기 및 회고',
    author: 'Gumgum',
    url: 'https://medium.com/@manjuguma/%ED%95%B4%EC%BB%A4%ED%86%A4-sparcs-%EA%B3%BC%ED%95%99-%ED%95%B4%EC%BB%A4%ED%86%A4-2024-%EC%B0%B8%EA%B0%80-%ED%9B%84%EA%B8%B0-%EB%B0%8F-%ED%9A%8C%EA%B3%A0-73f5774e3c3f',
    publishedDate: '2024-11-06',
  },
]

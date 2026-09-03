type Director = {
  name: string
  position: string
  term: string
  career: string[]
}

const Directors: Director[] = [
  {
    name: '한우영',
    position: '이사장',
    term: '2024. 10. 1. ~ 2028. 9. 30.',
    career: [
      '현) (주)에이핀아이앤씨 대표이사',
      '현) KAIST 전산학부 재학',
      '2021 대한민국 인재상 (교육부장관상) 수상',
    ],
  },
  {
    name: '오승빈',
    position: '상임이사',
    term: '2024. 10. 1. ~ 2028. 9. 30.',
    career: [
      '현) KAIST 전산학부 재학',
      '현) 프라이머사제파트너스 Fellow',
      '전) KAIST 총학생회 산하 SPARCS 회장, 기획국장',
      '전) 주식회사 클라썸 App Engineer Intern',
      '인천과학예술영재학교 졸업',
      '2023년 국방 공공데이터 활용 경진대회 대상(국방부장관상) 수상',
      '2019년 STEAM R&E 성과 발표회 부총리 겸 교육부장관상 수상',
    ],
  },
  {
    name: '박지호',
    position: '비상임이사',
    term: '2024. 10. 1. ~ 2028. 9. 30.',
    career: [
      '현) KAIST 전산학부 재학',
      '현) 영재학교, 과고 학생 대상 정보과학 강사',
      '전) 루센트블록, 새팜 SWE',
    ],
  },
  {
    name: '신도윤',
    position: '비상임이사',
    term: '2024. 10. 1. ~ 2028. 9. 30.',
    career: [
      '현) KAIST 전산학부 재학',
      '전) onTDB 대표',
      '한국코드페어 과학기술정보통신부 장관상 수상',
    ],
  },
  {
    name: '이레',
    position: '비상임이사',
    term: '2024. 10. 1. ~ 2028. 9. 30.',
    career: [
      '현) 주식회사 여기우리 대표이사',
      '현) KAIST 휴학',
      'MIT 해커톤 우승',
      '빅테크기업 인턴십(Google AI Team, Meta Growth Hacking, 88rising, Neubility etc)',
    ],
  },
]

export default function DirectorsTable() {
  return (
    <div className="krds-table-wrap">
      <table className="tbl col data">
        <caption>
          사단법인 에스티데브 이사회 명단으로 성명(직위), 임기, 약력으로
          구성되어 있습니다.
        </caption>
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '25%' }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">성명 (직위)</th>
            <th scope="col">임기</th>
            <th scope="col">약력</th>
          </tr>
        </thead>
        <tbody>
          {Directors.map((director) => (
            <tr key={director.name}>
              <th scope="row">
                {director.name}
                <br />({director.position})
              </th>
              <td className="cell-date">{director.term}</td>
              <td>
                <ul className="krds-info-list">
                  {director.career.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

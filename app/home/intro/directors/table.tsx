'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/table'

export default function DirectorsTable() {
  return (
    <Table>
      <TableHeader>
        <TableColumn>성명 (직위)</TableColumn>
        <TableColumn>임기</TableColumn>
        <TableColumn>약력</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            한우영
            <br />
            (이사장)
          </TableCell>
          <TableCell>2024. 10. 1. ~ 2028. 9. 30.</TableCell>
          <TableCell>
            현) (주)에이핀아이앤씨 대표이사
            <br />
            현) KAIST 전산학부 재학
            <br />
            2021 대한민국 인재상 (교육부장관상) 수상
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            오승빈
            <br />
            (상임이사)
          </TableCell>
          <TableCell>2024. 10. 1. ~ 2028. 9. 30.</TableCell>
          <TableCell>
            현) KAIST 전산학부 재학
            <br />
            현) 프라이머사제파트너스 Fellow
            <br />
            전) KAIST 총학생회 산하 SPARCS 회장, 기획국장
            <br />
            전) 주식회사 클라썸 App Engineer Intern
            <br />
            인천과학예술영재학교 졸업
            <br />
            2023년 국방 공공데이터 활용 경진대회 대상(국방부장관상) 수상
            <br />
            2019년 STEAM R&E 성과 발표회 부총리 겸 교육부장관상 수상
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            박지호
            <br />
            (비상임이사)
          </TableCell>
          <TableCell>2024. 10. 1. ~ 2028. 9. 30.</TableCell>
          <TableCell>
            현) KAIST 전산학부 재학
            <br />
            현) 영재학교, 과고 학생 대상 정보과학 강사
            <br />
            전) 루센트블록, 새팜 SWE
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            신도윤
            <br />
            (비상임이사)
          </TableCell>
          <TableCell>2024. 10. 1. ~ 2028. 9. 30.</TableCell>
          <TableCell>
            현) KAIST 전산학부 재학
            <br />
            전) onTDB 대표
            <br />
            한국코드페어 과학기술정보통신부 장관상 수상
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            이레
            <br />
            (비상임이사)
          </TableCell>
          <TableCell>2024. 10. 1. ~ 2028. 9. 30.</TableCell>
          <TableCell>
            현) 주식회사 여기우리 대표이사
            <br />
            현) KAIST 휴학
            <br />
            MIT 해커톤 우승
            <br />
            빅테크기업 인턴십(Google AI Team, Meta Growth Hacking, 88rising,
            Neubility etc)
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

import type { ReportWithFile } from '@/utils/cms-types'
import { toDateString } from '@/utils/datetime'

type Props = {
  reports: ReportWithFile[]
}

export default function RecordList(props: Props) {
  if (props.reports.length === 0) {
    return <p className="g-empty">자료가 존재하지 않습니다.</p>
  }

  return (
    <div className="krds-table-wrap">
      <table className="tbl col data">
        <caption>
          공시 자료 목록으로 제목, 발행일, 첨부파일로 구성되어 있습니다.
        </caption>
        <colgroup>
          <col />
          <col style={{ width: '20%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">제목</th>
            <th scope="col">발행일</th>
            <th scope="col">첨부파일</th>
          </tr>
        </thead>
        <tbody>
          {props.reports.map((record) => (
            <tr key={record.id}>
              <th scope="row">{record.title}</th>
              <td className="cell-date">
                {toDateString(record.publishedDate)}
              </td>
              <td className="cell-actions">
                <a
                  href={record.file_url}
                  className="krds-btn xsmall secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="새 창 열림"
                  aria-label={`${record.title} PDF 새 창으로 열기`}
                >
                  <i className="svg-icon ico-file" aria-hidden="true" />
                  PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import type { WebpageWithBusiness } from '@/utils/cms-types'
import { toDateString } from '@/utils/datetime'

type Props = {
  webpages: WebpageWithBusiness[]
}

export default function WebpageList(props: Props) {
  if (props.webpages.length === 0) {
    return <p className="g-empty">자료가 존재하지 않습니다.</p>
  }

  return (
    <ul className="link-list">
      {props.webpages.map((webpage) => (
        <li key={webpage.id}>
          <a
            href={webpage.url}
            target="_blank"
            rel="noopener noreferrer"
            title="새 창 열림"
          >
            <span className="item-tit">
              {webpage.title}
              <i className="svg-icon ico-go" aria-hidden="true" />
            </span>
            <span className="item-meta">
              <span>{webpage.author}</span>
              <span>{toDateString(webpage.publishedDate)}</span>
              <span className="meta-source">{webpage.business_name}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

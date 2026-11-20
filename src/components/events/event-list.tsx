import Link from 'next/link'
import MarkdownView from '@/components/markdown/markdown-view'
import { OrganizationNames } from '@/components/events/event-overview'
import type { EventSummary } from '@/utils/cms-types'
import {
  CATEGORY_LABELS,
  formatEventPeriod,
  formatEventPeriodShort,
} from '@/utils/events'

type Props = {
  events: EventSummary[]
}

/** 행사 목록. 개최일 내림차순으로 받은 그대로 그린다. */
export default function EventList({ events }: Props) {
  if (events.length === 0) {
    return <p className="g-empty">등록된 행사가 없습니다.</p>
  }

  return (
    <ul className="event-list">
      {events.map((event) => (
        <li key={event.id} className="event-item">
          <div className="event-item-head">
            <h3 className="event-item-tit">
              {event.href ? (
                <Link href={event.href}>{event.name}</Link>
              ) : (
                event.name
              )}
            </h3>
            <p className="event-item-period">
              <span className="sr-only">개최일 </span>
              {formatEventPeriodShort(event.startDate, event.endDate)}
            </p>
          </div>
          <dl className="event-item-meta">
            <div>
              <dt>분류</dt>
              <dd>{CATEGORY_LABELS[event.category]}</dd>
            </div>
            <div>
              <dt>일시</dt>
              <dd>
                {formatEventPeriod(
                  event.startDate,
                  event.endDate,
                  event.hasTime,
                )}
              </dd>
            </div>
            {event.location && (
              <div>
                <dt>장소</dt>
                <dd>{event.location}</dd>
              </div>
            )}
            {event.roles.map((group) => (
              <div key={group.role}>
                <dt>{group.label}</dt>
                <dd>
                  <OrganizationNames group={group} />
                </dd>
              </div>
            ))}
          </dl>
          {event.summary && (
            <div className="event-item-summary">
              <MarkdownView content={event.summary} />
            </div>
          )}
          {event.href && (
            <p className="event-item-more">
              <Link href={event.href} className="krds-btn small secondary">
                행사 페이지 보기
                <span className="sr-only">: {event.name}</span>
              </Link>
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

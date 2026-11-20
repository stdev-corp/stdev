import { Fragment } from 'react'
import type { EventRoleGroup, EventSummary } from '@/utils/cms-types'
import { formatEventPeriod } from '@/utils/events'

export function OrganizationNames({ group }: { group: EventRoleGroup }) {
  return group.organizations.map((organization, index) => (
    <Fragment key={organization.name}>
      {index > 0 && ', '}
      {organization.url ? (
        <a
          href={organization.url}
          target="_blank"
          rel="noopener noreferrer"
          title="새 창 열림"
        >
          {organization.name}
        </a>
      ) : (
        organization.name
      )}
    </Fragment>
  ))
}

/**
 * 행사 개요: 일시, 장소, 주최·주관·후원·협력. 노션 본문과 별개로 DB 필드에서
 * 그리는 KRDS 요약이다.
 */
export default function EventOverview({ event }: { event: EventSummary }) {
  return (
    <section className="event-overview" aria-label="행사 개요">
      <dl>
        <dt>일시</dt>
        <dd>
          {formatEventPeriod(event.startDate, event.endDate, event.hasTime)}
        </dd>
        {event.location && (
          <>
            <dt>장소</dt>
            <dd>{event.location}</dd>
          </>
        )}
        {event.roles.map((group) => (
          <Fragment key={group.role}>
            <dt>{group.label}</dt>
            <dd>
              <OrganizationNames group={group} />
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  )
}

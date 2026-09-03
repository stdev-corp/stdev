import Image from 'next/image'
import PageTitle from '@/components/krds/page-title'
import { queryHistories } from '@/utils/cms'
import { toDateString } from '@/utils/datetime'

export default async function HistoryPage() {
  const histories = await queryHistories()

  return (
    <>
      <PageTitle title="연혁" />
      <div className="conts-area">
        <div className="g-conts-area">
          {histories.length === 0 ? (
            <p className="g-empty">자료가 존재하지 않습니다.</p>
          ) : (
            <ol className="g-timeline">
              {histories.map((history) => (
                <li key={history.id}>
                  <span className="timeline-date">
                    {toDateString(history.date)}
                  </span>
                  <h2 className="timeline-tit">{history.title}</h2>
                  {history.content && (
                    <p className="timeline-desc">{history.content}</p>
                  )}
                  {history.imageUrl && (
                    <div className="timeline-img">
                      <Image
                        src={history.imageUrl}
                        alt={history.imageAlt || history.title}
                        width={400}
                        height={300}
                        sizes="400px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  )
}

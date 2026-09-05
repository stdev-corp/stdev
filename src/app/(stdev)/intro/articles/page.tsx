import PageTitle from '@/components/krds/page-title'
import { getLatestMarkdownByType } from '@/utils/cms'
import MarkdownView from '@/components/markdown/markdown-view'
import { toDateString } from '@/utils/datetime'

export default async function ArticlesPage() {
  const article = await getLatestMarkdownByType('articles')

  if (!article) {
    return (
      <>
        <PageTitle title="정관" />
        <div className="conts-area">
          <div className="g-conts-area">
            <p className="g-empty">정관이 등록되지 않았습니다.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageTitle
        title="사단법인 에스티데브 정관"
        description={`제정/개정일: ${toDateString(article.revisionDate)} | 시행일: ${toDateString(article.effectiveDate)}`}
      />
      <div className="conts-area">
        <div className="g-conts-area">
          <MarkdownView content={article.content} />
        </div>
      </div>
    </>
  )
}

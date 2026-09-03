import MarkdownView from '@/components/markdown/markdown-view'
import PageTitle from '@/components/krds/page-title'
import { getLatestMarkdownByType } from '@/utils/cms'
import { toDateString } from '@/utils/datetime'

export default async function TermsPage() {
  const terms = await getLatestMarkdownByType('terms')

  if (!terms) {
    return (
      <>
        <PageTitle title="이용약관" />
        <div className="conts-area">
          <div className="g-conts-area">
            <p className="g-empty">이용약관이 등록되지 않았습니다.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageTitle
        title="사단법인 에스티데브 이용약관"
        description={`제정/개정일: ${toDateString(terms.revisionDate)} | 시행일: ${toDateString(terms.effectiveDate)}`}
      />
      <div className="conts-area">
        <div className="g-conts-area">
          <MarkdownView content={terms.content} />
        </div>
      </div>
    </>
  )
}

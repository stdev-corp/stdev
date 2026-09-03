import MarkdownView from '@/components/markdown/markdown-view'
import PageTitle from '@/components/krds/page-title'
import { getLatestMarkdownByType } from '@/utils/cms'
import { toDateString } from '@/utils/datetime'

export default async function PrivacyPage() {
  const privacy = await getLatestMarkdownByType('privacy')

  if (!privacy) {
    return (
      <>
        <PageTitle title="개인정보처리방침" />
        <div className="conts-area">
          <div className="g-conts-area">
            <p className="g-empty">개인정보처리방침이 등록되지 않았습니다.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageTitle
        title="사단법인 에스티데브 개인정보처리방침"
        description={`제정/개정일: ${toDateString(privacy.revisionDate)} | 시행일: ${toDateString(privacy.effectiveDate)}`}
      />
      <div className="conts-area">
        <div className="g-conts-area">
          <MarkdownView content={privacy.content} />
        </div>
      </div>
    </>
  )
}

import RecordList from '@/components/record-list'

export default async function NoticesPage() {
  return (
    <div>
      <h1>공지사항</h1>
      <RecordList reports={[]} />
    </div>
  )
}

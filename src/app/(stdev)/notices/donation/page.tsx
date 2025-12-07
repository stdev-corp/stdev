import RecordList from '@/components/record-list'

export default async function DonationPage() {
  return (
    <div>
      <h1>연간 기부금 모금액 및 활용실적</h1>
      <RecordList reports={[]} />
    </div>
  )
}

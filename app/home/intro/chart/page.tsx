import Image from 'next/image'

export default async function ChartPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-8">조직도</h1>
      <Image
        src="/images/intro/chart.png"
        alt="Organization Chart"
        width={800}
        height={800}
      />
      <div className="h-[280px]" />
    </>
  )
}

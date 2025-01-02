import Image from 'next/image'

export default function ChartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold my-8">조직도</h1>
      <Image
        src="/images/intro/chart.png"
        alt="Organization Chart"
        width={800}
        height={800}
      />
      <div className="h-[280px]" />
    </div>
  )
}

import Image from 'next/image'

export default async function Page() {
  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="h-[120px]" />
      <Image
        src="/images/intro/title.png"
        alt="title"
        width={600}
        height={600}
      />
      <div className="h-[120px]" />
      <Image src="/images/intro/3w1h.png" alt="3w1h" width={800} height={800} />
      <div className="h-[120px]" />
      <Image
        src="/images/intro/history.png"
        alt="history"
        width={800}
        height={800}
      />
      <div className="h-[120px]" />
    </div>
  )
}

import { queryInstitutions } from '@/utils/server/institutions'
import Image from 'next/image'

export default async function Page() {
  const institutions = await queryInstitutions()

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
      <div className="bg-gray-100 py-12">
        <div className="container mx-auto px-6 lg:px-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            함께하는 기관
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {institutions.map((institution, index) => (
              <div key={index} className="flex items-center justify-center">
                <Image
                  src={institution.imageUrl}
                  alt={`Logo ${index + 1}`}
                  width={120}
                  height={60}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="h-[120px]" />
    </div>
  )
}

import type { InstitutionLogo } from '@/utils/cms-types'
import NextImage from 'next/image'

type Props = {
  institutions: InstitutionLogo[]
}

export default function ScrollingLogos({ institutions }: Props) {
  if (institutions.length === 0) {
    return null
  }

  return (
    <div className="logo-marquee">
      <div className="marquee-track">
        {/* 끊김 없는 무한 흐름을 위해 목록을 두 번 렌더링한다. */}
        {[...institutions, ...institutions].map((institution, index) => (
          <div key={index} className="marquee-item">
            <NextImage
              src={institution.imageUrl || '/images/intro/title.png'}
              alt={
                institution.imageAlt ||
                `함께하는 기관 로고 ${(index % institutions.length) + 1}`
              }
              fill
              sizes="180px"
              style={{ objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

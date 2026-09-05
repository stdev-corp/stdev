// KRDS HTML 컴포넌트 킷. 순서가 곧 우선순위이므로 토큰/컴포넌트 CSS를 먼저,
// 사이트 오버라이드를 마지막에 불러온다. 아이콘과 글꼴은 public/krds 아래에
// 절대 경로로 남아 있어 번들러가 건드리지 않는다.
import '@/styles/krds/krds-fonts.css'
import '@/styles/krds/krds.min.css'
import '@/styles/krds/stdev-krds.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'

export const metadata: Metadata = {
  title: 'STDev Corp.',
  description: '사단법인 STDev 홈페이지',
  icons: {
    icon: '/favicon.ico',
  },
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  if (!gtmId) {
    throw new Error('NEXT_PUBLIC_GTM_ID is not defined')
  }
  if (!gaId) {
    throw new Error('NEXT_PUBLIC_GA_ID is not defined')
  }

  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
      <GoogleTagManager gtmId={gtmId} />
      <GoogleAnalytics gaId={gaId} />
    </html>
  )
}

import type { Metadata } from 'next'
import { Providers } from './providers'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import './globals.css'

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
      <body style={{ minHeight: '100vh' }}>
        <Providers>{children}</Providers>
      </body>
      <GoogleTagManager gtmId={gtmId} />
      <GoogleAnalytics gaId={gaId} />
    </html>
  )
}

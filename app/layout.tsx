import type { Metadata } from 'next'
import { Providers } from './providers'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

export const metadata: Metadata = {
  title: 'STDev Corp.',
  description: '사단법인 STDev 홈페이지',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
      <GoogleAnalytics gaId="G-8S1XRBF33D" />
    </html>
  )
}

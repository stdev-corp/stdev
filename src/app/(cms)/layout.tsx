import type { ReactNode } from 'react'
import { Providers } from './providers'

export const dynamic = 'force-dynamic'

export default function CmsLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ minHeight: '100vh', margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

import type { ReactNode } from 'react'
// 행사 본문 미리보기가 공개 페이지와 같은 노션 모양으로 보이도록 불러온다.
// .notion-page 안에만 적용되므로 Chakra 화면에는 영향이 없다.
import '@/styles/krds/stdev-notion.css'
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

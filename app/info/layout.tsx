import { ReactNode } from 'react'
import Navigation from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { auth } from '@/utils/auth'

export const dynamic = 'force-dynamic'

type Props = {
  children: ReactNode
}

export default async function Layout(props: Props) {
  const session = await auth()

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <Navigation user={session?.user} />
      <div className="flex-1 py-8">{props.children}</div>
      <Footer />
    </div>
  )
}

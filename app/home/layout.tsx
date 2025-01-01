import { ReactNode } from 'react'
import Navigation from './navbar'
import Footer from './footer'
import { auth } from '@/utils/auth'

type Props = {
  children: ReactNode
}

export default async function Layout(props: Props) {
  const session = await auth()

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <Navigation user={session?.user} />
      <div className="flex-1">{props.children}</div>
      <Footer />
    </div>
  )
}

import { ReactNode } from 'react'
import Navigation from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

type Props = {
  children: ReactNode
}

export default async function Layout(props: Props) {
  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <Navigation />
      <div className="flex-1 py-8 px-8">{props.children}</div>
      <Footer />
    </div>
  )
}

import { ReactNode } from 'react'
import Navigation from './navbar'
import Footer from './footer'

type Props = {
  children: ReactNode
}

export default async function Layout(props: Props) {
  return (
    <>
      <Navigation />
      {props.children}
      <Footer />
    </>
  )
}

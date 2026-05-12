import type { ReactNode } from 'react'

export function AdminSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

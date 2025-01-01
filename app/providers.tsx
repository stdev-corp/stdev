'use client'
import { NextUIProvider } from '@nextui-org/system'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextUIProvider style={{ minHeight: '100vh' }}>{children}</NextUIProvider>
  )
}

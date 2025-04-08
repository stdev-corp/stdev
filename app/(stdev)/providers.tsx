'use client'
import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import { HeroUIProvider } from '@heroui/react'
import { ReactNode, useEffect } from 'react'

if (!process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY) {
  throw new Error('NEXT_PUBLIC_CHANNEL_PLUGIN_KEY is not defined')
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    ChannelService.loadScript()
    ChannelService.boot({
      pluginKey: process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY!,
    })
    return () => {
      ChannelService.shutdown()
    }
  }, [])

  return (
    <HeroUIProvider style={{ minHeight: '100vh' }}>{children}</HeroUIProvider>
  )
}

'use client'
import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import { NextUIProvider } from '@nextui-org/system'
import { ReactNode, useEffect } from 'react'

if (!process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY) {
  throw new Error('NEXT_PUBLIC_CHANNEL_PLUGIN_KEY is not defined')
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log('ChannelService.loadScript()')
    ChannelService.loadScript()
    ChannelService.boot({
      pluginKey: process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY!,
    })
    return () => {
      ChannelService.shutdown()
    }
  }, [])

  return (
    <NextUIProvider style={{ minHeight: '100vh' }}>{children}</NextUIProvider>
  )
}

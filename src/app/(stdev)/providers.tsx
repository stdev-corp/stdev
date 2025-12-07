'use client'
import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import { ReactNode, useEffect } from 'react'
import { Box, ChakraProvider, defaultSystem } from '@chakra-ui/react'

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
    <ChakraProvider value={defaultSystem}>
      <Box minH="100vh">{children}</Box>
    </ChakraProvider>
  )
}

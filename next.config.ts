import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stdev-kr.s3.ap-northeast-2.amazonaws.com',
        port: '',
        pathname: '**',
        search: '',
      },
    ],
  },
  experimental: {
    authInterrupts: true,
  },
}

export default withPayload(nextConfig)

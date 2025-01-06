import type { NextConfig } from 'next'

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
}

export default nextConfig

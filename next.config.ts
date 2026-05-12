import type { NextConfig } from 'next'

const s3Hosts = new Set([
  'stdev-kr.s3.ap-northeast-2.amazonaws.com',
  process.env.S3_BUCKET
    ? `${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION ?? 'ap-northeast-2'}.amazonaws.com`
    : null,
])

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [...s3Hosts]
      .filter((hostname): hostname is string => Boolean(hostname))
      .map((hostname) => ({
        protocol: 'https',
        hostname,
        port: '',
        pathname: '**',
        search: '',
      })),
  },
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig

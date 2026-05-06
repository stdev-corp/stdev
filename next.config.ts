import type { NextConfig } from 'next'

const s3Hosts = new Set([
  'stdev-kr.s3.ap-northeast-2.amazonaws.com',
  process.env.PAYLOAD_S3_BASE_URL
    ? new URL(process.env.PAYLOAD_S3_BASE_URL).hostname
    : null,
  process.env.PAYLOAD_S3_TARGET_BUCKET
    ? `${process.env.PAYLOAD_S3_TARGET_BUCKET}.s3.${process.env.AWS_REGION ?? 'ap-northeast-2'}.amazonaws.com`
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

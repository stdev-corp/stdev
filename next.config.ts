import type { NextConfig } from 'next'
import { Links } from './src/utils/links'

const s3Hosts = new Set([
  'stdev-kr.s3.ap-northeast-2.amazonaws.com',
  process.env.S3_BUCKET
    ? `${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION ?? 'ap-northeast-2'}.amazonaws.com`
    : null,
])

// E2E serves S3 assets from the local sidecar instead of the bucket (see
// toPublicAssetUrl). Next refuses to optimize images from loopback addresses
// unless dangerouslyAllowLocalIP is set, so allow that only for a loopback base;
// production leaves S3_PUBLIC_BASE_URL unset and keeps the S3-only patterns.
const publicAssetBase = process.env.S3_PUBLIC_BASE_URL
  ? new URL(process.env.S3_PUBLIC_BASE_URL)
  : null
const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]'])

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      ...[...s3Hosts]
        .filter((hostname): hostname is string => Boolean(hostname))
        .map((hostname) => ({
          protocol: 'https' as const,
          hostname,
          port: '',
          pathname: '**',
          search: '',
        })),
      ...(publicAssetBase
        ? [
            {
              protocol: publicAssetBase.protocol === 'http:' ? 'http' : 'https',
              hostname: publicAssetBase.hostname,
              port: publicAssetBase.port,
              pathname: `${publicAssetBase.pathname.replace(/\/+$/, '')}/**`,
              search: '',
            } as const,
          ]
        : []),
    ],
    dangerouslyAllowLocalIP: Boolean(
      publicAssetBase && loopbackHosts.has(publicAssetBase.hostname),
    ),
  },
  experimental: {
    authInterrupts: true,
    // 라우트 그룹마다 루트 레이아웃이 있어 app/not-found.tsx를 둘 공통 레이아웃이
    // 없다. app/global-not-found.tsx로 어떤 라우트에도 맞지 않는 URL을 처리한다.
    globalNotFound: true,
  },
  async redirects() {
    return [
      // 법인소개 첫 페이지가 /intro에서 하위 메뉴로 옮겨 갔다.
      { source: '/intro', destination: Links.introAbout, permanent: true },
    ]
  },
}

export default nextConfig

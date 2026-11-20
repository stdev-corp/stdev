import type { NextConfig } from 'next'
import { HOST, Links } from './src/utils/links'

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
  async rewrites() {
    // 노션 페이지 ID(대시 있는/없는 32자리 16진수)로 된 행사 주소는 리다이렉트용
    // 라우트 핸들러가 받는다. 페이지 안에서는 진짜 308을 줄 수 없기 때문이다.
    const hex = (count: number) => '[0-9a-fA-F]'.repeat(count)
    const notionId = [hex(8), hex(4), hex(4), hex(4), hex(12)].join('-?')
    return {
      beforeFiles: [
        {
          source: `/:section(hackathon|conference)/:id(${notionId})`,
          destination: '/api/legacy-notion/:id',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  async redirects() {
    // event.stdev.kr(Oopy)에 있던 행사 페이지는 같은 슬러그로 /hackathon 아래에
    // 옮겨 왔다. 그 도메인을 이 서버로 돌리면 옛 주소가 그대로 이어진다.
    // 노션 페이지 ID로 된 주소(/1b83ff07-…)는 아래 rewrites가 notionId로 찾아 넘긴다.
    const eventHost = [{ type: 'host' as const, value: 'event.stdev.kr' }]
    return [
      // 법인소개 첫 페이지가 /intro에서 하위 메뉴로 옮겨 갔다.
      { source: '/intro', destination: Links.introAbout, permanent: true },
      // '행사&프로그램' 메뉴가 '해커톤&아이디어톤', '컨퍼런스&프로그램'으로 나뉘었다.
      { source: '/business', destination: Links.hackathon, permanent: true },
      {
        source: '/business/hackathon',
        destination: Links.hackathon,
        permanent: true,
      },
      {
        source: '/business/conference',
        destination: Links.conference,
        permanent: true,
      },
      {
        source: '/business/news',
        destination: Links.hackathonNews,
        permanent: true,
      },
      {
        source: '/business/blog',
        destination: Links.hackathonBlog,
        permanent: true,
      },
      {
        source: '/',
        has: eventHost,
        destination: `${HOST}${Links.hackathon}`,
        permanent: true,
      },
      {
        // Oopy 첫 페이지('사단법인 STDev')의 노션 ID 주소
        source: '/:id(1b83ff07-?ff5b-?8051-?810e-?ea2915cdc850)',
        has: eventHost,
        destination: `${HOST}${Links.hackathon}`,
        permanent: true,
      },
      {
        source: '/:path*',
        has: eventHost,
        destination: `${HOST}${Links.hackathon}/:path*`,
        permanent: true,
      },
    ]
  },
}

export default nextConfig

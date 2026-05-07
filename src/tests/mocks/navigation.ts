import { vi } from 'vitest'

export const redirectMock = vi.fn((url: string) => {
  const err = new Error(`NEXT_REDIRECT;${url}`) as Error & {
    digest?: string
  }
  err.digest = `NEXT_REDIRECT;push;${url};307;`
  throw err
})

export const forbiddenMock = vi.fn(() => {
  const err = new Error('NEXT_HTTP_ERROR_FALLBACK;403') as Error & {
    digest?: string
  }
  err.digest = 'NEXT_HTTP_ERROR_FALLBACK;403'
  throw err
})

export const unauthorizedMock = vi.fn(() => {
  const err = new Error('NEXT_HTTP_ERROR_FALLBACK;401') as Error & {
    digest?: string
  }
  err.digest = 'NEXT_HTTP_ERROR_FALLBACK;401'
  throw err
})

export const notFoundMock = vi.fn(() => {
  const err = new Error('NEXT_NOT_FOUND') as Error & { digest?: string }
  err.digest = 'NEXT_NOT_FOUND'
  throw err
})

export const routerPushMock = vi.fn()
export const routerReplaceMock = vi.fn()
export const routerBackMock = vi.fn()
export const routerForwardMock = vi.fn()
export const routerRefreshMock = vi.fn()
export const routerPrefetchMock = vi.fn()

export const usePathnameMock = vi.fn(() => '/')
export const useSearchParamsMock = vi.fn(() => new URLSearchParams())

vi.mock('next/navigation', async () => {
  return {
    redirect: redirectMock,
    forbidden: forbiddenMock,
    unauthorized: unauthorizedMock,
    notFound: notFoundMock,
    useRouter: () => ({
      push: routerPushMock,
      replace: routerReplaceMock,
      back: routerBackMock,
      forward: routerForwardMock,
      refresh: routerRefreshMock,
      prefetch: routerPrefetchMock,
    }),
    usePathname: usePathnameMock,
    useSearchParams: useSearchParamsMock,
    useParams: () => ({}),
    useSelectedLayoutSegment: () => null,
    useSelectedLayoutSegments: () => [],
    RedirectType: {
      push: 'push',
      replace: 'replace',
    },
  }
})

export function resetNavigationMocks() {
  redirectMock.mockClear()
  forbiddenMock.mockClear()
  unauthorizedMock.mockClear()
  notFoundMock.mockClear()
  routerPushMock.mockClear()
  routerReplaceMock.mockClear()
  routerBackMock.mockClear()
  routerForwardMock.mockClear()
  routerRefreshMock.mockClear()
  routerPrefetchMock.mockClear()
  usePathnameMock.mockClear()
  useSearchParamsMock.mockClear()
}

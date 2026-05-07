import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  const first = args[0]
  if (typeof first === 'string' || first instanceof Error) {
    const text = typeof first === 'string' ? first : first.message
    if (text.includes('Could not parse CSS stylesheet')) {
      return
    }
    if (text.includes('Not implemented: navigation')) {
      return
    }
  }
  originalConsoleError(...args)
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgres://postgres:test@localhost:5432/stdev_test'
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? 'test-secret-key'
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET ?? 'test-google-client-secret'
process.env.NEXT_PUBLIC_GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-TEST'
process.env.NEXT_PUBLIC_GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-TEST'
process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY =
  process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY ?? 'test-channel-key'
process.env.AWS_REGION = process.env.AWS_REGION ?? 'ap-northeast-2'
process.env.AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY ?? 'test-access-key'
process.env.AWS_SECRET_KEY = process.env.AWS_SECRET_KEY ?? 'test-secret-key'
process.env.PAYLOAD_S3_TARGET_BUCKET =
  process.env.PAYLOAD_S3_TARGET_BUCKET ?? 'stdev-kr'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver
}

if (typeof globalThis.matchMedia === 'undefined') {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserverMock {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  } as unknown as typeof IntersectionObserver
}

if (typeof globalThis.scrollTo === 'undefined') {
  globalThis.scrollTo = vi.fn() as unknown as typeof scrollTo
}

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

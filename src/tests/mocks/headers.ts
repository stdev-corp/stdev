import { vi } from 'vitest'

export const headersMock = vi.fn(() => new Headers())

export const cookiesGetMock = vi.fn((_name: string) => undefined)
export const cookiesGetAllMock = vi.fn(
  () => [] as Array<{ name: string; value: string }>,
)
export const cookiesSetMock = vi.fn()
export const cookiesDeleteMock = vi.fn()
export const cookiesHasMock = vi.fn(() => false)

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(headersMock()),
  cookies: () =>
    Promise.resolve({
      get: cookiesGetMock,
      getAll: cookiesGetAllMock,
      set: cookiesSetMock,
      delete: cookiesDeleteMock,
      has: cookiesHasMock,
    }),
  draftMode: () => ({
    isEnabled: false,
    enable: vi.fn(),
    disable: vi.fn(),
  }),
}))

export function resetHeadersMocks() {
  headersMock.mockClear()
  cookiesGetMock.mockClear()
  cookiesGetAllMock.mockClear()
  cookiesSetMock.mockClear()
  cookiesDeleteMock.mockClear()
  cookiesHasMock.mockClear()
}

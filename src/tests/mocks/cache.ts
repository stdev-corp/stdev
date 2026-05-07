import { vi } from 'vitest'

export const revalidatePathMock = vi.fn()
export const revalidateTagMock = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}))

export function resetCacheMocks() {
  revalidatePathMock.mockClear()
  revalidateTagMock.mockClear()
}

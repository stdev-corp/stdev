import { vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'

export const prismaMock =
  mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>

export function resetPrismaMock() {
  mockReset(prismaMock)
}

vi.mock('@/utils/prisma', () => ({
  prisma: prismaMock,
}))

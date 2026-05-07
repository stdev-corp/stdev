import { vi } from 'vitest'

export const queryInstitutionsMock = vi.fn()
export const queryWebpagesMock = vi.fn()
export const queryReportsMock = vi.fn()
export const getMarkdownsByTypeMock = vi.fn()
export const getLatestMarkdownByTypeMock = vi.fn()
export const queryHistoriesMock = vi.fn()

vi.mock('@/utils/cms', () => ({
  queryInstitutions: queryInstitutionsMock,
  queryWebpages: queryWebpagesMock,
  queryReports: queryReportsMock,
  getMarkdownsByType: getMarkdownsByTypeMock,
  getLatestMarkdownByType: getLatestMarkdownByTypeMock,
  queryHistories: queryHistoriesMock,
}))

export function resetCmsMocks() {
  queryInstitutionsMock.mockReset()
  queryWebpagesMock.mockReset()
  queryReportsMock.mockReset()
  getMarkdownsByTypeMock.mockReset()
  getLatestMarkdownByTypeMock.mockReset()
  queryHistoriesMock.mockReset()
  queryInstitutionsMock.mockResolvedValue([])
  queryWebpagesMock.mockResolvedValue([])
  queryReportsMock.mockResolvedValue([])
  getMarkdownsByTypeMock.mockResolvedValue([])
  getLatestMarkdownByTypeMock.mockResolvedValue(null)
  queryHistoriesMock.mockResolvedValue([])
}

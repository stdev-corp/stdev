import { vi } from 'vitest'

export const queryInstitutionsMock = vi.fn()
export const queryWebpagesMock = vi.fn()
export const queryReportsMock = vi.fn()
export const getMarkdownsByTypeMock = vi.fn()
export const getLatestMarkdownByTypeMock = vi.fn()
export const queryHistoriesMock = vi.fn()
export const queryEventsMock = vi.fn()
export const getSectionIntroMock = vi.fn()
export const getEventDetailMock = vi.fn()
export const getEventPageMock = vi.fn()
export const queryEventWebpagesMock = vi.fn()
export const queryEventSitemapPathsMock = vi.fn()
export const findNotionRedirectMock = vi.fn()

vi.mock('@/utils/cms', () => ({
  queryInstitutions: queryInstitutionsMock,
  queryWebpages: queryWebpagesMock,
  queryReports: queryReportsMock,
  getMarkdownsByType: getMarkdownsByTypeMock,
  getLatestMarkdownByType: getLatestMarkdownByTypeMock,
  queryHistories: queryHistoriesMock,
  queryEvents: queryEventsMock,
  getSectionIntro: getSectionIntroMock,
  getEventDetail: getEventDetailMock,
  getEventPage: getEventPageMock,
  queryEventWebpages: queryEventWebpagesMock,
  queryEventSitemapPaths: queryEventSitemapPathsMock,
  findNotionRedirect: findNotionRedirectMock,
}))

export function resetCmsMocks() {
  queryInstitutionsMock.mockReset()
  queryWebpagesMock.mockReset()
  queryReportsMock.mockReset()
  getMarkdownsByTypeMock.mockReset()
  getLatestMarkdownByTypeMock.mockReset()
  queryHistoriesMock.mockReset()
  queryEventsMock.mockReset()
  getSectionIntroMock.mockReset()
  getEventDetailMock.mockReset()
  getEventPageMock.mockReset()
  queryEventWebpagesMock.mockReset()
  queryEventSitemapPathsMock.mockReset()
  findNotionRedirectMock.mockReset()
  queryInstitutionsMock.mockResolvedValue([])
  queryWebpagesMock.mockResolvedValue([])
  queryReportsMock.mockResolvedValue([])
  getMarkdownsByTypeMock.mockResolvedValue([])
  getLatestMarkdownByTypeMock.mockResolvedValue(null)
  queryHistoriesMock.mockResolvedValue([])
  queryEventsMock.mockResolvedValue([])
  getSectionIntroMock.mockResolvedValue(null)
  getEventDetailMock.mockResolvedValue({ kind: 'missing' })
  getEventPageMock.mockResolvedValue({ kind: 'missing' })
  queryEventWebpagesMock.mockResolvedValue([])
  queryEventSitemapPathsMock.mockResolvedValue([])
  findNotionRedirectMock.mockResolvedValue(null)
}

import { beforeEach, describe, expect, it } from 'vitest'
import '@/tests/mocks/cms'
import { findNotionRedirectMock, resetCmsMocks } from '@/tests/mocks/cms'
import { GET } from '@/app/api/legacy-notion/[id]/route'

function call(id: string) {
  return GET(new Request(`http://localhost/api/legacy-notion/${id}`), {
    params: Promise.resolve({ id }),
  })
}

describe('GET /api/legacy-notion/[id]', () => {
  beforeEach(() => {
    resetCmsMocks()
  })

  it('옮겨진 페이지면 상대 주소로 308 리다이렉트한다', async () => {
    findNotionRedirectMock.mockResolvedValue('/hackathon/ssi26/apply')

    const response = await call('3053ff07ff5b81bd8cffc7b08d02f978')

    expect(findNotionRedirectMock).toHaveBeenCalledWith(
      '3053ff07ff5b81bd8cffc7b08d02f978',
    )
    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('/hackathon/ssi26/apply')
  })

  it('찾지 못하면 행사 목록 링크가 있는 404를 준다', async () => {
    const response = await call('00000000-0000-0000-0000-000000000000')

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('href="/hackathon"')
  })
})

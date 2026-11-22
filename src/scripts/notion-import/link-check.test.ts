import { describe, expect, it, vi } from 'vitest'
import { GONE_STATUSES, isLinkAlive, LinkCheckError } from './link-check'

const URL = 'https://example.com/image.jpg'

function response(status: number) {
  return new Response(status === 204 ? null : 'body', { status })
}

function setup(...results: (number | Error)[]) {
  const request = vi.fn<typeof fetch>()
  for (const result of results) {
    if (result instanceof Error) request.mockRejectedValueOnce(result)
    else request.mockResolvedValueOnce(response(result))
  }
  const delay = vi.fn(async (_ms: number) => undefined)
  return { request, delay, options: { fetch: request, delay } }
}

function dnsError(code: string) {
  return Object.assign(new TypeError('fetch failed'), { cause: { code } })
}

describe('isLinkAlive', () => {
  it('정상 응답이면 살아 있다', async () => {
    const { request, delay, options } = setup(200)
    await expect(isLinkAlive(URL, options)).resolves.toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(
      URL,
      expect.objectContaining({ redirect: 'follow' }),
    )
    expect(delay).not.toHaveBeenCalled()
  })

  it.each(GONE_STATUSES)(
    '%i 응답은 원본이 사라진 것으로 보고 다시 시도하지 않는다',
    async (status) => {
      const { request, options } = setup(status)
      await expect(isLinkAlive(URL, options)).resolves.toBe(false)
      expect(request).toHaveBeenCalledTimes(1)
    },
  )

  it('도메인이 없어졌으면(ENOTFOUND) 사라진 것으로 본다', async () => {
    const { request, options } = setup(dnsError('ENOTFOUND'))
    await expect(isLinkAlive(URL, options)).resolves.toBe(false)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('일시 오류(5xx, 429, 네트워크, 시간 초과) 뒤 성공하면 살아 있다', async () => {
    const { request, delay, options } = setup(
      503,
      429,
      Object.assign(new Error('The operation timed out'), {
        name: 'TimeoutError',
      }),
      200,
    )
    await expect(isLinkAlive(URL, { ...options, attempts: 4 })).resolves.toBe(
      true,
    )
    expect(request).toHaveBeenCalledTimes(4)
    expect(delay.mock.calls.map(([ms]) => ms)).toEqual([1000, 2000, 4000])
  })

  it('일시 오류가 끝내 이어지면 그림을 빼지 않고 예외를 던진다', async () => {
    const { request, delay, options } = setup()
    // 마지막은 Error가 아닌 값으로 거부되는 경우: 그 값을 사유로 남긴다.
    request
      .mockResolvedValueOnce(response(500))
      .mockRejectedValueOnce(dnsError('EAI_AGAIN'))
      .mockRejectedValueOnce('plain failure')

    const result = isLinkAlive(URL, options)
    await expect(result).rejects.toBeInstanceOf(LinkCheckError)
    await expect(result).rejects.toThrow(/plain failure/)
    await expect(result).rejects.toThrow(URL)
    expect(request).toHaveBeenCalledTimes(3)
    expect(delay.mock.calls.map(([ms]) => ms)).toEqual([1000, 2000])
  })

  it('마지막 실패가 HTTP 응답이면 그 상태를 사유로 남긴다', async () => {
    const { options } = setup(502, 502, 502)
    await expect(isLinkAlive(URL, options)).rejects.toThrow('HTTP 502')
  })

  it('본문이 없는 응답도 다룬다', async () => {
    const { options } = setup(204)
    await expect(isLinkAlive(URL, options)).resolves.toBe(true)
  })

  it('기본 대기 함수로 다시 시도한다', async () => {
    vi.useFakeTimers()
    try {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response(500))
        .mockResolvedValueOnce(response(200))
      const result = isLinkAlive(URL, { fetch: request })
      await vi.advanceTimersByTimeAsync(1000)
      await expect(result).resolves.toBe(true)
      expect(request).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

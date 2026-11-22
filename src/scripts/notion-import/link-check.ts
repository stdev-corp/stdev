/*
 * 변환할 때 본문에 그대로 쓰는 외부 이미지와 북마크 그림이 아직 있는지 확인한다.
 *
 * 원본이 사라졌다는 확실한 응답(403/404/410, 없어진 도메인)만 '없음'으로 본다. 시간
 * 초과, 네트워크 오류, 429, 5xx는 일시 오류로 보고 몇 번 다시 시도하며, 그래도
 * 실패하면 예외를 던져 변환을 멈춘다. 일시 오류로 그림을 빼 버리면 그 묶음을 가져온
 * 행사는 '이미 채워짐'이 되어, 원본이 돌아와도 다시 가져오기로 되살아나지 않는다.
 */

/** 원본이 사라졌다고 보는 응답. 가져오기(import.ts)가 건너뛰는 응답과 같다. */
export const GONE_STATUSES = [403, 404, 410]

export class LinkCheckError extends Error {}

type Options = {
  fetch?: typeof fetch
  /** 처음 요청을 포함한 시도 횟수 */
  attempts?: number
  delay?: (ms: number) => Promise<void>
  timeoutMs?: number
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 도메인 자체가 없어졌다(DNS NXDOMAIN). 다시 시도해도 같다. */
function domainGone(error: unknown) {
  const cause = (error as { cause?: { code?: unknown } } | null)?.cause
  return cause?.code === 'ENOTFOUND'
}

/**
 * 주소가 살아 있으면 true, 원본이 사라졌으면 false. 끝내 판단하지 못하면
 * LinkCheckError를 던진다.
 */
export async function isLinkAlive(
  url: string,
  {
    fetch: request = fetch,
    attempts = 3,
    delay = wait,
    timeoutMs = 15000,
  }: Options = {},
): Promise<boolean> {
  let reason = ''
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await delay(1000 * 2 ** (attempt - 1))
    }
    try {
      const response = await request(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      })
      // 본문은 쓰지 않으니 연결을 바로 놓아 준다.
      await response.body?.cancel().catch(() => undefined)
      if (response.ok) return true
      if (GONE_STATUSES.includes(response.status)) return false
      reason = `HTTP ${response.status}`
    } catch (error) {
      if (domainGone(error)) return false
      reason = error instanceof Error ? error.message : String(error)
    }
  }
  throw new LinkCheckError(
    `외부 주소를 확인하지 못해 변환을 멈춥니다(${reason}): ${url}\n` +
      '일시 오류일 수 있어 내용을 바꾸지 않았습니다. 잠시 뒤 다시 실행하세요.',
  )
}

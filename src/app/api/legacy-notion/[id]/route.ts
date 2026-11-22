import { findNotionRedirect } from '@/utils/cms'

export const dynamic = 'force-dynamic'

/**
 * 옛 Oopy 주소(노션 페이지 ID)를 새 행사 주소로 308 리다이렉트한다.
 *
 * next.config.ts가 /hackathon/<노션 ID>, /conference/<노션 ID>를 여기로 다시 쓴다.
 * 행사 페이지에서 바로 리다이렉트하면 (stdev)/loading.tsx 경계 때문에 응답이 이미
 * 200으로 시작된 뒤라 진짜 308을 줄 수 없다.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const href = await findNotionRedirect(id)
  if (!href) {
    return new Response(
      '<!doctype html><html lang="ko"><meta charset="utf-8"><title>페이지를 찾을 수 없습니다</title><p>옮겨진 행사 페이지를 찾을 수 없습니다. <a href="/hackathon">행사 목록으로 가기</a></p></html>',
      {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      },
    )
  }
  // 리버스 프록시 뒤에서도 바른 호스트로 가도록 상대 주소를 준다.
  return new Response(null, { status: 308, headers: { location: href } })
}

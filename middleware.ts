import { NextRequest, NextResponse, userAgent } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const ua = userAgent(request)
  url.searchParams.set('ua', JSON.stringify(ua))
  return NextResponse.rewrite(url)
}

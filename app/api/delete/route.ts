import { Model, prisma } from '@/utils/prisma'
import { NextRequest, NextResponse } from 'next/server'

const HOST =
  process.env.NODE_ENV === 'production'
    ? 'https://stdev.kr'
    : 'https://localhost:3000'

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams
  const model = searchParams.get('model') as Model
  const id = searchParams.get('id') as string
  const redirectPath = searchParams.get('redirectPath') ?? '/'

  switch (model) {
    case 'redirect':
      await prisma.redirect.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
      break
    default:
      break
  }

  return NextResponse.redirect(new URL(redirectPath, HOST))
}

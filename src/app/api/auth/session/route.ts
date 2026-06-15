import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/current-user'

export async function GET() {
  try {
    const user = await getCurrentUser()

    return NextResponse.json({
      authenticated: Boolean(user),
      user,
    })
  } catch {
    return NextResponse.json(
      { message: '세션 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
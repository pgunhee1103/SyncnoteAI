import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/current-user'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: '인증되지 않은 사용자입니다.' },
        { status: 401 },
      )
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json(
      { message: '사용자 정보를 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}
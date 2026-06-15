import { NextResponse } from 'next/server'
import { deleteCurrentSession } from '@/features/auth/server/session.service'

export async function POST() {
  try {
    await deleteCurrentSession()

    return NextResponse.json({
      message: '로그아웃되었습니다.',
    })
  } catch {
    return NextResponse.json(
      { message: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
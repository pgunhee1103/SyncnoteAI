import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { loginUser } from '@/features/auth/server/auth.service'
import { createSessionForUser } from '@/features/auth/server/session.service'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const user = await loginUser({
      email: body.email,
      password: body.password,
    })

    await createSessionForUser(user)

    return NextResponse.json({
      message: '로그인되었습니다.',
      user,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: '입력값이 올바르지 않습니다.',
          errors: error.issues,
        },
        { status: 400 },
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { message: '로그인 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
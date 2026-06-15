import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { registerUser } from '@/features/auth/server/auth.service'
import { createSessionForUser } from '@/features/auth/server/session.service'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const user = await registerUser({
      email: body.email,
      password: body.password,
      displayName: body.displayName,
    })

    await createSessionForUser(user)

    return NextResponse.json(
      {
        message: '회원가입이 완료되었습니다.',
        user,
      },
      { status: 201 },
    )
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
        { status: 400 },
      )
    }

    return NextResponse.json(
      { message: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
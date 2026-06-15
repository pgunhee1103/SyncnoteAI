import { cookies } from 'next/headers'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/server/auth/auth.constants'

export async function setSessionCookie(token: string) { // 로그인 처리
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 개발 중일때 secure 끄고, 배포하면 켜지게 자동으로 바꿔주는 코드
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function getSessionCookie(): Promise<string | undefined> { // 로그인 확인
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

export async function clearSessionCookie() { // 로그아웃 처리
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // 수명(maxAge)이 0이 되는 순간, 브라우저는 이 쿠키를 즉시 삭제
  })
}
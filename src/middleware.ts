import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/server/auth/auth.constants'

const PROTECTED_PREFIXES = ['/documents']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/documents/:path*'],
}
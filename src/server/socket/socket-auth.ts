import type { Socket } from 'socket.io'
import { prisma } from '@/server/db/prisma'
import { SESSION_COOKIE_NAME } from '@/server/auth/auth.constants'

function parseCookies(cookieHeader?: string) {
  const result: Record<string, string> = {}

  if (!cookieHeader) return result

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=')
    const key = rawKey?.trim()
    const value = rawValue.join('=').trim()

    if (key) {
      result[key] = decodeURIComponent(value)
    }
  }

  return result
}

export async function getSocketUser(socket: Socket) {
  const cookieHeader = socket.handshake.headers.cookie
  const cookies = parseCookies(cookieHeader)
  const token = cookies[SESSION_COOKIE_NAME]

  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
        },
      },
    },
  })

  if (!session) {
    return null
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({
      where: { token },
    })

    return null
  }

  return session.user
}
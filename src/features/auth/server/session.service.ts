import { randomBytes } from 'node:crypto'
import { prisma } from '@/server/db/prisma'
import { clearSessionCookie, setSessionCookie } from '@/server/auth/session-cookie'
import type { SafeUser } from '@/features/auth/types'

const SESSION_EXPIRES_DAYS = 7

function createSessionToken(): string {
  return randomBytes(32).toString('hex')
}

function getSessionExpiresAt(): Date {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRES_DAYS)
  return expiresAt
}

export async function createSession(userId: string) {
  const token = createSessionToken()
  const expiresAt = getSessionExpiresAt()

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  await setSessionCookie(token)

  return { token, expiresAt }
}

export async function deleteCurrentSession() {
  const { getSessionCookie } = await import('@/server/auth/session-cookie')
  const token = await getSessionCookie()

  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    })
  }

  await clearSessionCookie()
}

export async function createSessionForUser(user: SafeUser) {
  return createSession(user.id)
}
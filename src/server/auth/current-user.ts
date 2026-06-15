import { prisma } from '@/server/db/prisma'
import { getSessionCookie } from '@/server/auth/session-cookie'

export async function getCurrentUser() {
  const token = await getSessionCookie()

  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { // join
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
    await prisma.session.delete({
      where: { token },
    }).catch(() => null)

    return null // 만료되었으니 유효하지않은 사용자라고 알림
  }

  return session.user
}
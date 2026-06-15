import { getCurrentUser } from '@/server/auth/current-user'

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  return user
}
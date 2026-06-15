import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/current-user'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
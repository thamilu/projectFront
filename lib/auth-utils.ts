import { getServerSession } from 'next-auth'
import { authOptions } from './auth-config'
import { redirect } from 'next/navigation'

// Server-side: Get session
export async function getSession() {
  return await getServerSession(authOptions)
}

// Server-side: Get current user or redirect
export async function getCurrentUser() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/auth/login')
  }

  return session.user
}

// Server-side: Check if user has role
export async function hasRole(role: string): Promise<boolean> {
  const session = await getSession()
  return session?.user?.roles?.includes(role) ?? false
}

// Server-side: Require specific role
export async function requireRole(role: string) {
  const session = await getSession()

  if (!session?.user?.roles?.includes(role)) {
    redirect('/403')
  }

  return session.user
}

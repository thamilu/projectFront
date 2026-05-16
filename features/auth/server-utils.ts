import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Requires a user to be authenticated and have specific roles.
 * Redirects to login or unauthorized page if requirements are not met.
 */
export async function requireAuth(roles: string[] = []) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (roles.length > 0) {
    const userRoles = (session as any).roles || []
    const hasRole = roles.some(role => userRoles.includes(role.toUpperCase()))
    
    if (!hasRole) {
      redirect('/unauthorized')
    }
  }

  return session
}

/**
 * Checks if a user has a specific role without redirecting.
 */
export async function hasRole(role: string) {
  const session = await auth()
  if (!session) return false
  
  const userRoles = (session as any).roles || []
  return userRoles.includes(role.toUpperCase())
}

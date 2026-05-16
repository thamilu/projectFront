import NextAuth from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { env } from '@/env'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: env.KEYCLOAK_CLIENT_ID,
      clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      issuer: env.KEYCLOAK_ISSUER,
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Forward Keycloak access token to Spring Boot
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      // Expose accessToken to the client-side session
      session.accessToken = token.accessToken as string
      session.error = token.error as string | undefined
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  trustHost: true,
})

// Extend session type for TypeScript
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    error?: string
  }
}

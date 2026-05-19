import NextAuth from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { env } from '@/env'

/**
 * Standard Keycloak Token Refresh flow [HARDEN]
 * Renews the access token in the background using the Keycloak refresh token.
 */
async function refreshAccessToken(token: any) {
  try {
    const url = `${env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.KEYCLOAK_CLIENT_ID,
        client_secret: env.KEYCLOAK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token if a new one isn't returned
    }
  } catch (error) {
    console.error('Error refreshing access token from Keycloak:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

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
      // First-time sign-in initialization
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.expiresAt = account.expires_at
        return token
      }

      // Return the cached token if it has not expired yet
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // If token is expired or close to expiration, request a refreshed token
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      // Expose accessToken and any refresh errors to the client-side session context
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

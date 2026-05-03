/* eslint-disable no-console */
import { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'
import { JWT } from 'next-auth/jwt'
import { setLastExchange } from '@/lib/auth-debug'
import { type AuthErrorCode } from '@/lib/auth/errors'
import { decodeJwt } from 'jose'

// Normalize issuer and avoid trailing slashes
const ISSUER = (process.env.KEYCLOAK_ISSUER || '').replace(/\/$/, '')

// Global promise to deduplicate concurrent refresh requests
let refreshPromise: Promise<JWT> | null = null

async function refreshAccessToken(token: JWT): Promise<JWT> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[auth] deduplicating refreshAccessToken request')
    }
    return refreshPromise
  }

  // Create a new promise for the refresh operation
  refreshPromise = (async () => {
    try {
    const url = `${ISSUER}/protocol/openid-connect/token`
    const params = new URLSearchParams({
      client_id: process.env.KEYCLOAK_CLIENT_ID!,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken as string,
    })

    // Only include client_secret when configured (confidential client)
    if (process.env.KEYCLOAK_CLIENT_SECRET) {
      params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET)
    }

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[auth] refreshAccessToken url=', url)
      console.debug('[auth] refreshAccessToken params=', params.toString())
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    const text = await response.text()
    let refreshedTokens: unknown = {}
    try {
      refreshedTokens = JSON.parse(text)
    } catch {
      // Not JSON
      refreshedTokens = { error: 'invalid_response', raw: text }
    }

    // Store last exchange for dev debugging
    try {
      setLastExchange({
        time: new Date().toISOString(),
        type: 'refresh',
        status: response.status,
        body: refreshedTokens,
        raw: text,
      })
    } catch {}

    if (!response.ok) {
      console.error('[auth] refresh token failed', response.status, refreshedTokens)
      // Log full response for debugging if possible
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[auth] full error response:', text)
      }
      throw refreshedTokens
    }

    const rt = refreshedTokens as Record<string, unknown>;
    const accessToken = typeof rt['access_token'] === 'string' ? (rt['access_token'] as string) : undefined;
    const expiresIn = typeof rt['expires_in'] === 'number' ? (rt['expires_in'] as number) : typeof rt['expires_in'] === 'string' ? Number(rt['expires_in']) : undefined;
    const refreshTok = typeof rt['refresh_token'] === 'string' ? (rt['refresh_token'] as string) : undefined;

    return {
      ...token,
      accessToken,
      accessTokenExpires: Date.now() + ((expiresIn || 0) * 1000),
      refreshToken: refreshTok ?? token.refreshToken,
    }
  } catch (error) {
    console.error('Error refreshing access token', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
    } finally {
      // Clear the promise when done so next refresh can start
      refreshPromise = null
  }
  })()

  return refreshPromise
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Build provider config dynamically so we only supply clientSecret for confidential clients
    KeycloakProvider(
      ((): any => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const cfg: Record<string, unknown> = {
          clientId: process.env.KEYCLOAK_CLIENT_ID!,
          issuer: ISSUER,
          authorization: {
            url: `${ISSUER}/protocol/openid-connect/auth`,
            params: { scope: 'openid email profile offline_access' },
          },
          token: `${ISSUER}/protocol/openid-connect/token`,
          userinfo: `${ISSUER}/protocol/openid-connect/userinfo`,
        }
        if (process.env.KEYCLOAK_CLIENT_SECRET) cfg.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return cfg as any
      })()
    ),
  ],

  callbacks: {
    async jwt({ token, account, profile, trigger: _trigger }) {
      // Initial sign in
      if (account && account.access_token) {
        try {
          // Decode the access token directly to get roles reliably
          // This bypasses potential issues with the 'profile' object structure
          const decoded = decodeJwt(account.access_token)
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const realmRoles = (decoded.realm_access as any)?.roles || []
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resourceAccess = (decoded.resource_access as any) || {}
          
          const roles = [
            ...realmRoles,
            // Flatten resource_access roles
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...Object.values(resourceAccess).flatMap((r: any) => r.roles || [])
          ]
          
          const uniqueRoles = Array.from(new Set(roles)) as string[]

          // Log for debugging
          if (process.env.NODE_ENV !== 'production') {
            console.log('[NextAuth] Decoded roles from access_token:', uniqueRoles)
          }

          setLastExchange({
            time: new Date().toISOString(),
            type: 'signin',
            body: { 
              account: { token_type: account.token_type, expires_at: account.expires_at }, 
              roles: uniqueRoles 
            },
          })

          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpires: (account.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 60 * 1000),
            roles: uniqueRoles,
            userId: decoded.sub as string,
          }
        } catch (error) {
           console.error('[NextAuth] Failed to decode access token:', error)
           // Fallback to original logic if decoding fails
           return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpires: (account.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 60 * 1000),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            roles: (profile as any)?.realm_access?.roles || [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            userId: (profile as any)?.sub as string,
           }
        }
      }

      // Don't refresh if no refresh token available
      if (!token.refreshToken) {
        return token
      }

      // Return token if not expired (with 60 second buffer)
      const now = Date.now()
      const expiresAt = (token.accessTokenExpires as number) || 0
      if (expiresAt > now + 60_000) {
        return token
      }

      // ❌ CRITICAL: Token is expired or expiring soon - refresh it ONLY here (single source of truth)
      // This should only run when a user is already logged in and has a valid refresh token
      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string
      session.error = token.error as AuthErrorCode | undefined
      session.accessToken = token.accessToken as string
      session.error = token.error as AuthErrorCode | undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!session.user) session.user = { name: undefined, email: undefined } as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session.user as any).id = token.userId as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session.user as any).roles = token.roles as string[]
      
      // Fix: Populate top-level roles compatible with route checking logic
      session.roles = token.roles as string[]

      return session
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Helpful debug output during development
  debug: process.env.NODE_ENV !== 'production',

  logger: {
    error(code, metadata) {
      console.error('NextAuth error', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth warning', code)
    },
    debug(code, metadata) {
      console.debug('NextAuth debug', code, metadata)
    },
  },

  events: {
    async signOut({ token }) {
      // Logout from Keycloak
      if (token?.refreshToken) {
        try {
          const url = `${ISSUER}/protocol/openid-connect/logout`
          const params = new URLSearchParams({
            client_id: process.env.KEYCLOAK_CLIENT_ID!,
            refresh_token: token.refreshToken as string,
          })
          if (process.env.KEYCLOAK_CLIENT_SECRET) {
            params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET)
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
          })

          const respText = await response.text().catch(() => '')
          try {
            setLastExchange({
              time: new Date().toISOString(),
              type: 'logout',
              status: response.status,
              raw: respText,
            })
          } catch {}

          if (!response.ok) {
            const body = respText
            console.error('[auth] logout failed', response.status, body)
          }
        } catch (error) {
          console.error('Error logging out from Keycloak', error)
        }
      }
    },
  },
}

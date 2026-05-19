// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DefaultSession, DefaultUser } from 'next-auth'
// eslint-disable-next-line @typescript-eslint/no-unused-vars  
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string
    refreshToken?: string
    roles?: string[]
    error?: string
    user: {
      id: string
      roles: string[]
    } & DefaultSession['user']
  }

  interface Profile {
    realm_access?: {
      roles: string[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    roles?: string[]
    userId?: string
    error?: string
  }
}

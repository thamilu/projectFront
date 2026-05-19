import { z } from 'zod';

export interface AuthConfig {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  tokenEndpoint: string;
  jwksUri?: string;
}

export const CallbackParamsSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const OAuthErrorSchema = z.object({
  error: z.string().optional(),
  error_description: z.string().optional(),
  error_uri: z.string().optional(),
});

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  id_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_expires_in: z.number().optional(),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const PkceStateSchema = z.object({
  state: z.string(),
  codeVerifier: z.string(),
  nonce: z.string(),
  redirectTo: z.string().optional(),
  createdAt: z.number(),
  clientIp: z.string().optional(),
  userAgent: z.string().optional(),
});

export type PkceState = z.infer<typeof PkceStateSchema>;

export interface SessionData {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  expiresAt: number;
  refreshExpiresAt?: number;
  userId: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  roles: string[];
  sessionId: string;
  createdAt: number;
  lastActivityAt: number;
  clientIp?: string;
  userAgent?: string;
}

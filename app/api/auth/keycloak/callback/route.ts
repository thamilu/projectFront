import { NextRequest, NextResponse } from 'next/server';
import { retrievePkceState, createSession, clearPkceState } from '@/lib/auth/session';
import { loadAuthConfig, getTokenEndpoint } from '@/lib/auth/config';
import { validateIdToken, extractRoles } from '@/lib/auth/tokens';
import { logger } from '@/lib/observability/logger';
import { tokenExchange } from '@/lib/http/fetch-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      const errorDescription = searchParams.get('error_description');
      logger.error('[Auth Callback] Auth error from provider', { error, errorDescription });
      return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
    }

    if (!code || !state) {
      logger.error('[Auth Callback] Missing code or state');
      return NextResponse.redirect(new URL('/login?error=missing_params', req.url));
    }

    // 1. Retrieve and validate PKCE state
    const pkceState = await retrievePkceState();
    if (!pkceState) {
      logger.error('[Auth Callback] Invalid or expired PKCE state');
      return NextResponse.redirect(new URL('/login?error=invalid_state', req.url));
    }

    if (pkceState.state !== state) {
      logger.error('[Auth Callback] State mismatch');
      await clearPkceState();
      return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
    }

    // 2. Exchange code for tokens
    const config = loadAuthConfig();
    if (!config) {
      throw new Error('Auth config not loaded');
    }

    const tokenEndpoint = getTokenEndpoint(config);
    const redirectUri =
      process.env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/keycloak/callback`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: pkceState.codeVerifier,
    });

    if (config.clientSecret) {
      params.append('client_secret', config.clientSecret);
    }

    const tokens = await tokenExchange(tokenEndpoint, params) as any;

    if (!tokens || !tokens.access_token) {
      logger.error('[Auth Callback] Token exchange failed - no access token received');
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', req.url));
    }

    // 3. Validate ID Token
    if (!tokens.id_token) {
      logger.error('[Auth Callback] Missing ID token');
      return NextResponse.redirect(new URL('/login?error=missing_id_token', req.url));
    }

    const validation = await validateIdToken(tokens.id_token, pkceState.nonce);

    if (!validation.valid || !validation.payload) {
      logger.error('[Auth Callback] Token validation failed', { error: validation.error });
      return NextResponse.redirect(new URL('/login?error=validation_failed', req.url));
    }

    // 4. Create Session
    const roles = extractRoles(validation.payload);

    await createSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token, // Keycloak usually returns this
      idToken: tokens.id_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      userId: validation.payload.sub,
      email: validation.payload.email,
      name: validation.payload.name || validation.payload.preferred_username,
      roles: roles,
    });

    // 5. Cleanup and Redirect
    await clearPkceState();

    const redirectTo = pkceState.redirectTo || '/';
    logger.info('[Auth Callback] Login successful', { userId: validation.payload.sub, redirectTo });

    return NextResponse.redirect(new URL(redirectTo, req.url));
  } catch (error) {
    logger.error('[Auth Callback] Unexpected error', { error });
    return NextResponse.redirect(new URL('/login?error=server_error', req.url));
  }
}

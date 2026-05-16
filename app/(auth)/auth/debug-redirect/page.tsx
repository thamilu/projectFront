/**
 * Developer Debug Page: Auth Redirect Info
 *
 * Shows the exact `redirect_uri` and a sample authorization URL
 * that the frontend sends to Keycloak. This is useful when
 * configuring Keycloak client "Valid Redirect URIs" during local
 * development.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getKeycloakConfig, getKeycloakEndpoints } from '@/lib/auth/keycloak-config';

export default function DebugRedirectPage() {
  // Build APP_URL and redirect target
  const API_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082').replace(/\/$/, '');

  const redirectUri = `${API_URL}`;
  let clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID || 'eshop-client';
  let authEndpoint = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL || process.env.KEYCLOAK_AUTH_URL || 'http://localhost:8080/realms/eshop/protocol/openid-connect/auth'}`;

  try {
    const cfg = getKeycloakConfig();
    const endpoints = getKeycloakEndpoints(cfg);
    clientId = cfg.clientId;
    authEndpoint = endpoints.authorization;
  } catch {
    // ignore - show best-effort values from env
  }

  const sampleAuthUrl = `${authEndpoint}?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Developer: Keycloak Redirect Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Use the values below to whitelist redirect URIs in your Keycloak client
            configuration (Clients → eshop-client → Valid Redirect URIs).
          </p>

          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground">Exact redirect URI to whitelist</label>
            <pre className="mt-1 rounded border bg-card p-3 text-sm overflow-auto">{redirectUri}</pre>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground">Client ID</label>
            <pre className="mt-1 rounded border bg-card p-3 text-sm overflow-auto">{clientId}</pre>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground">Sample authorization URL (copy into browser to reproduce)</label>
            <pre className="mt-1 rounded border bg-card p-3 text-sm overflow-auto">{sampleAuthUrl}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

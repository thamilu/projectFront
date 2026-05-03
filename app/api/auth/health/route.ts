/**
 * Health Check Endpoint for Next-Auth
 * Verifies that the API routes are working correctly
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if environment variables are loaded
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
    const hasKeycloakIssuer = !!(
      process.env.KEYCLOAK_ISSUER ||
      process.env.NEXT_PUBLIC_KEYCLOAK_URL
    );
    const hasKeycloakClientId = !!(
      process.env.KEYCLOAK_CLIENT_ID ||
      process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
    );

    const isHealthy = hasNextAuthSecret && hasKeycloakIssuer && hasKeycloakClientId;

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: {
        hasNextAuthSecret,
        hasKeycloakIssuer,
        hasKeycloakClientId,
        nodeEnv: process.env.NODE_ENV,
      },
    }, {
      status: isHealthy ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
}

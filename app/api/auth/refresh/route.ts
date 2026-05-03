/**
 * Token Refresh Proxy - POST /api/auth/refresh
 * 
 * Delegates to Keycloak refresh endpoint using direct import pattern.
 * This avoids:
 * - Network overhead (no self-fetch)
 * - Set-Cookie header loss (direct response)
 * - Timeout complexity (handled by upstream)
 * - Request duplication
 * 
 * This is a convenience endpoint that provides a shorter URL
 * (/api/auth/refresh vs /api/auth/keycloak/refresh)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/observability/logger';

// ============================================================================
// POST Handler - Direct Delegation
// ============================================================================

/**
 * Token refresh endpoint
 * 
 * Note: Direct Keycloak integration removed. Use NextAuth session refresh instead.
 * This endpoint is kept for backward compatibility but returns error.
 * 
 * For token refresh, use:
 * - NextAuth automatic refresh in jwt() callback
 * - Manual refresh via signIn() with refresh_token
 */
export async function POST(_req: NextRequest) {
  logger.warn('Legacy refresh endpoint called - use NextAuth session refresh instead');
  
  return NextResponse.json(
    { 
      error: 'deprecated',
      message: 'Use NextAuth session management for token refresh' 
    },
    { status: 410 }
  );
}

// ============================================================================
// Method Guards - Reject Non-POST Requests
// ============================================================================

/**
 * GET not allowed for token refresh (security)
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'Token refresh requires POST request',
    },
    { 
      status: 405,
      headers: { 'Allow': 'POST' },
    }
  );
}

/**
 * PUT not allowed
 */
export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'Token refresh requires POST request',
    },
    { 
      status: 405,
      headers: { 'Allow': 'POST' },
    }
  );
}

/**
 * DELETE not allowed
 */
export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'Token refresh requires POST request',
    },
    { 
      status: 405,
      headers: { 'Allow': 'POST' },
    }
  );
}

/**
 * PATCH not allowed
 */
export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'Token refresh requires POST request',
    },
    { 
      status: 405,
      headers: { 'Allow': 'POST' },
    }
  );
}

// ============================================================================
// Next.js Configuration
// ============================================================================

/**
 * Force dynamic rendering - never cache this endpoint
 */
export const dynamic = 'force-dynamic';

/**
 * Use Node.js runtime
 */
export const runtime = 'nodejs';

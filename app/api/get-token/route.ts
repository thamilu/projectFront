/**
 * Helper API route to get access token from NextAuth session
 * This is needed because NextAuth doesn't expose accessToken to client by default
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function GET(_req: NextRequest) {
  try {
    // Get server-side session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Access the token from the JWT (server-side only)
    // Note: This requires the jwt() callback to store accessToken in the token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = (session as any).accessToken;

    if (!accessToken) {
      // If not in session, we need to get it from the JWT callback
      // For now, return the session to help debug
      return NextResponse.json({
        message: 'Access token not found in session',
        sessionData: {
          user: session.user,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          roles: (session as any).roles,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresAt: (session as any).expiresAt,
        },
      });
    }

    return NextResponse.json({
      accessToken,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresAt: (session as any).expiresAt,
    });
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

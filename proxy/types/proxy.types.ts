import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  auth: Session | null;
}

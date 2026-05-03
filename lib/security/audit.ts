import { logger } from '@/lib/observability/logger';

export async function recordSecurityViolation(ctx: unknown, violationType: string, details?: Record<string, unknown>) {
  logger.warn('AUDIT:security_violation', { violationType, ctx, details });
}

export async function recordAuthEvent(eventType: string, ctx: unknown, success: boolean, metadata?: Record<string, unknown>) {
  logger.info('AUDIT:auth_event', { eventType, ctx, success, metadata });
}

export const securityAudit = {
  recordSecurityViolation,
  recordAuthEvent,
};

export function createAuditContext(requestId: string, request?: { headers: Headers }) {
  return {
    requestId,
    clientIp: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  };
}

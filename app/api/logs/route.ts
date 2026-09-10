/**
 * POST /api/logs
 *
 * Receives structured log entries emitted by the browser-side logger and
 * forwards them into the server's logging pipeline.
 *
 * [SECURITY] This endpoint writes to durable, operator-trusted storage, so it
 * is treated as a privileged sink rather than a convenience. The previous
 * fourteen-line implementation was unauthenticated, unthrottled, unbounded and
 * unvalidated: it accepted any JSON with truthy `level` and `message` fields
 * and passed it straight to `logger.logEntry()`. That allowed anyone to
 *
 *   - forge entries indistinguishable from genuine application logs,
 *   - flood log storage (a direct cost and retention-window attack),
 *   - inject newline/control sequences that corrupt records in a downstream
 *     SIEM or log aggregator,
 *
 * and it returned the raw exception message on failure. Every one of those is
 * addressed below.
 *
 * Client entries are stamped with `source: 'client'` and the authenticated
 * user id **server-side**, so a forged `source` field in the payload cannot
 * make a browser-submitted line masquerade as a server-emitted one.
 */

import { z } from 'zod';
import {
  withRoute,
  requireSession,
  readValidatedBody,
  enforceRateLimit,
  apiSuccess,
} from '@/shared/api';
import { logger } from '@/core/telemetry/logger';

// ============================================================
// 1. LIMITS
// ============================================================

/** Marks these entries as browser-originated in downstream log storage. */
const SERVICE_NAME = 'web-client';

/**
 * Bounds chosen to comfortably fit a real client error — message plus a
 * stack trace and a small context object — while making bulk-ingestion abuse
 * uneconomic. A caller needing more should be sampling, not sending more.
 */
const MAX_BODY_BYTES = 8 * 1024; // 8 KB
const MAX_MESSAGE_CHARS = 2_000;
const MAX_CONTEXT_ENTRIES = 40;
const MAX_CONTEXT_VALUE_CHARS = 1_000;

// ============================================================
// 2. CONTRACT
// ============================================================

/**
 * Strip characters that let a log line escape its own record.
 *
 * CR/LF are the classic log-injection vector (a forged newline creates what
 * looks like a separate, attacker-authored entry). ANSI escape sequences are
 * stripped too: an operator tailing logs in a terminal should never have their
 * display manipulated by user-supplied content.
 */
const sanitiseText = (value: string): string =>
  value
    // C0 controls (incl. CR/LF/TAB), DEL, and C1 controls. Replaced with a
    // space rather than removed so words either side do not run together.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    // Collapse the runs the substitution above can create.
    .replace(/\s{2,}/g, ' ')
    .trim();

const safeString = (maxChars: number) =>
  z.string().max(maxChars).transform(sanitiseText);

/**
 * Context values are constrained to primitives. Allowing arbitrary nested
 * objects would reintroduce an unbounded payload through a field the size cap
 * alone cannot meaningfully police, and no legitimate client log needs it.
 */
const contextValueSchema = z.union([
  safeString(MAX_CONTEXT_VALUE_CHARS),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const logEntrySchema = z.object({
  /**
   * Constrained to the logger's own enum. The previous version accepted any
   * truthy value, so `level: "CRITICAL-SECURITY-BREACH"` was ingestible.
   */
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: safeString(MAX_MESSAGE_CHARS).pipe(z.string().min(1, 'message must not be empty')),
  context: z
    .record(z.string().max(64), contextValueSchema)
    .refine((ctx) => Object.keys(ctx).length <= MAX_CONTEXT_ENTRIES, {
      message: `context may contain at most ${MAX_CONTEXT_ENTRIES} keys`,
    })
    .optional(),
  /** Client-supplied ISO timestamp; advisory only — see the handler. */
  timestamp: z.string().datetime().optional(),
});

// ============================================================
// 3. HANDLER
// ============================================================

export const POST = withRoute('logs', async (req, { log, requestId }) => {
  // Authenticated: an anonymous visitor has no legitimate need to write to
  // operator-trusted storage, and requiring identity is what makes the
  // per-user throttle below meaningful.
  const caller = await requireSession(req);

  await enforceRateLimit(`logs:ingest:${caller.userId}`);

  const entry = await readValidatedBody(req, logEntrySchema, MAX_BODY_BYTES);

  logger.logEntry({
    // The authoritative timestamp is the server's. A client clock may be
    // wrong, unset, or deliberately skewed to bury an entry in the past; the
    // client's own value is preserved in context for correlation.
    timestamp: new Date().toISOString(),
    level: entry.level,
    message: entry.message,
    service: SERVICE_NAME,
    environment: process.env.NODE_ENV ?? 'development',
    requestId,
    context: {
      ...entry.context,
      // Server-stamped and therefore unforgeable. Placed after the spread so a
      // crafted payload cannot override them and pass itself off as a
      // server-emitted line.
      source: 'client',
      userId: caller.userId,
      clientTimestamp: entry.timestamp,
    },
  });

  log.debug('Client log entry ingested', { level: entry.level, userId: caller.userId });

  // 202: the entry is accepted for processing. The client has no reason to
  // wait on, or branch upon, what the logging pipeline does next.
  return apiSuccess({ accepted: true }, { status: 202 });
});

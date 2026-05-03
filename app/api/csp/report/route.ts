import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/observability/logger'

/**
 * Standard CSP Violation Report Structure
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */
interface CSPViolationReport {
  'csp-report': {
    'document-uri': string
    'blocked-uri': string
    'violated-directive': string
    'effective-directive': string
    'original-policy': string
    'disposition': 'enforce' | 'report'
    'status-code': number
    'source-file'?: string
    'line-number'?: number
    'column-number'?: number
    'script-sample'?: string
  }
}

type CSPReportPayload = CSPViolationReport | string | null

interface ParseResult {
  payload: CSPReportPayload
  contentType: string
  error?: string
}

/**
 * Parses incoming CSP report payload with proper error handling
 * @param req - Incoming Next.js request
 * @returns Parsed payload with metadata
 */
async function parseCSPPayload(req: NextRequest): Promise<ParseResult> {
  const contentType = req.headers.get('content-type') || ''

  try {
    const isJSON =
      contentType.includes('application/json') || contentType.includes('application/csp-report')

    const payload = isJSON ? await req.json() : await req.text()
    return { payload, contentType }
  } catch (err) {
    logger.warn('[CSP Report] Failed to parse request body', {
      contentType,
      error: err instanceof Error ? err.message : 'Unknown parsing error',
      userAgent: req.headers.get('user-agent'),
    })
    return { payload: null, contentType, error: 'parse_failed' }
  }
}

/**
 * Validates CSP report payload structure
 * @param payload - Parsed payload to validate
 * @returns true if payload contains expected CSP report structure
 */
function isValidCSPReport(payload: unknown): payload is CSPViolationReport {
  if (!payload || typeof payload !== 'object') return false
  const report = payload as Record<string, unknown>
  return (
    'csp-report' in report &&
    typeof report['csp-report'] === 'object' &&
    report['csp-report'] !== null
  )
}

/**
 * Determines log severity based on violated directive
 * @param report - CSP violation report
 * @returns Appropriate log level
 */
function getViolationSeverity(report: CSPViolationReport): 'error' | 'warn' | 'info' {
  const directive = report['csp-report']['violated-directive']
  const effectiveDirective = report['csp-report']['effective-directive']

  // Critical directives that could indicate XSS attempts
  const criticalDirectives = ['script-src', 'default-src', 'script-src-elem', 'script-src-attr']

  if (criticalDirectives.some((d) => directive.includes(d) || effectiveDirective.includes(d))) {
    return 'error'
  }

  // Moderate severity for other security-relevant directives
  const moderateDirectives = ['style-src', 'connect-src', 'frame-src', 'object-src']
  if (moderateDirectives.some((d) => directive.includes(d) || effectiveDirective.includes(d))) {
    return 'warn'
  }

  // Lower severity for resource directives
  return 'info'
}

/**
 * CSP Report Receiver
 *
 * @endpoint POST /api/csp/report
 * @accepts application/csp-report, application/json, text/plain
 * @returns 204 - Report accepted and logged
 * @returns 400 - Invalid/unparseable report
 *
 * Accepts browsers' Content Security Policy violation reports and logs them
 * with appropriate severity levels. Tolerates different content-types and
 * browser implementation variations.
 *
 * Security Note: All CSP violations are logged in production to detect
 * potential XSS attempts, policy misconfigurations, and security incidents.
 * Rate limiting should be handled at infrastructure/proxy level.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */
export async function POST(req: NextRequest) {
  const { payload, contentType, error } = await parseCSPPayload(req)

  // Handle parsing failures
  if (error || payload === null) {
    logger.warn('[CSP Report] Empty or unparseable payload received', {
      contentType,
      error,
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
      requestId: req.headers.get('x-request-id'),
    })
    return NextResponse.json({ error: 'invalid_report' }, { status: 400 })
  }

  // Extract request metadata for correlation
  const metadata = {
    contentType,
    userAgent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
    requestId: req.headers.get('x-request-id'),
    timestamp: new Date().toISOString(),
  }

  // Validate and log CSP violation reports
  if (isValidCSPReport(payload)) {
    const severity = getViolationSeverity(payload)
    const cspReport = payload['csp-report']

    // Log with appropriate severity based on violation type
    logger[severity]('[CSP Violation]', {
      ...metadata,
      blockedUri: cspReport['blocked-uri'],
      violatedDirective: cspReport['violated-directive'],
      effectiveDirective: cspReport['effective-directive'],
      disposition: cspReport['disposition'],
      documentUri: cspReport['document-uri'],
      sourceFile: cspReport['source-file'],
      lineNumber: cspReport['line-number'],
      columnNumber: cspReport['column-number'],
      scriptSample: cspReport['script-sample'],
      statusCode: cspReport['status-code'],
    })
  } else {
    // Log non-standard payloads with lower severity
    logger.info('[CSP Report] Non-standard payload received', {
      ...metadata,
      payload: typeof payload === 'string' ? payload.substring(0, 500) : payload,
    })
  }

  // Return 204 No Content (optimal response - no body overhead)
  return new NextResponse(null, { status: 204 })
}

/**
 * GET handler for CSP report endpoint
 *
 * Some browsers may issue GET requests during preflight or health checks.
 * Respond with 204 to be tolerant of different browser behaviors.
 *
 * @returns 204 - Endpoint is available
 */
export function GET() {
  return new NextResponse(null, { status: 204 })
}

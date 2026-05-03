import { NextResponse } from 'next/server'
import { getLastExchange } from '@/lib/auth-debug'

/**
 * Development-only auth debug endpoint.
 * Defense-in-depth: only enabled when running in a dev environment
 * and when an explicit toggle is set. Returns consistent JSON responses
 * and includes debug metadata.
 */

interface AuthDebugResponse {
  ok: boolean
  lastExchange: unknown | null
  timestamp: number
  error?: string
}

const JSON_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'X-Robots-Tag': 'noindex, nofollow',
} as const

function isDebugEnabled(): boolean {
  const isDev = process.env.NODE_ENV === 'development'
  const debugFlag = (process.env.ENABLE_AUTH_DEBUG || 'false').toLowerCase()
  return isDev && debugFlag === 'true'
}

// Basic local rate limiting to avoid accidental spamming in dev
let lastRequestAt = 0
const MIN_INTERVAL_MS = 50

export async function GET(): Promise<NextResponse<AuthDebugResponse>> {
  if (!isDebugEnabled()) {
    // Return 404 to avoid advertising the endpoint in non-dev builds
    return NextResponse.json(
      { ok: false, lastExchange: null, timestamp: Date.now(), error: 'Not found' },
      { status: 404, headers: JSON_HEADERS }
    )
  }

  const now = Date.now()
  if (now - lastRequestAt < MIN_INTERVAL_MS) {
    return NextResponse.json(
      { ok: false, lastExchange: null, timestamp: now, error: 'Too many requests' },
      { status: 429, headers: JSON_HEADERS }
    )
  }
  lastRequestAt = now

  try {
    const rec = getLastExchange()
    return NextResponse.json(
      { ok: true, lastExchange: rec ?? null, timestamp: Date.now() },
      { headers: JSON_HEADERS }
    )
  } catch (error: unknown) {
    // Avoid exposing internal details; log server-side for developer debugging
    console.error('[auth-debug] getLastExchange failed:', error)
    return NextResponse.json(
      { ok: false, lastExchange: null, timestamp: Date.now(), error: 'Failed to retrieve debug data' },
      { status: 500, headers: JSON_HEADERS }
    )
  }
}

export async function POST() {
  return NextResponse.json({ ok: false, lastExchange: null, timestamp: Date.now(), error: 'Method not allowed' }, { status: 405, headers: JSON_HEADERS })
}

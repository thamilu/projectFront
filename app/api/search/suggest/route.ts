/**
 * GET /api/search/suggest
 * 
 * Search suggestions and autocomplete endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { suggestSearchTerms } from '@/lib/search/elasticsearch-client'
import { getRequestLogger } from '@/lib/observability/logger'

const suggestSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  size: z.coerce.number().positive().max(20).optional().default(10),
})

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const log = getRequestLogger(requestId)

  try {
    const { searchParams } = new URL(request.url)

    const params = suggestSchema.parse({
      q: searchParams.get('q'),
      size: searchParams.get('size') || '10',
    })

    log.info('Search suggestions request', {
      query: params.q,
      size: params.size,
      requestId,
    })

    const results = await suggestSearchTerms(params.q, params.size)

    log.info('Search suggestions completed', {
      query: params.q,
      suggestionsCount: results.suggestions.length,
      productsCount: results.products.length,
      requestId,
    })

    return NextResponse.json(
      {
        suggestions: results.suggestions,
        products: results.products,
      },
      {
        headers: {
          'X-Request-ID': requestId,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    log.error('Search suggestions failed', { error, requestId })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: error.issues,
        },
        {
          status: 400,
          headers: { 'X-Request-ID': requestId },
        }
      )
    }

    return NextResponse.json(
      {
        error: 'Suggestions failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: { 'X-Request-ID': requestId },
      }
    )
  }
}

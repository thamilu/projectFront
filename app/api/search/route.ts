/**
 * GET /api/search
 * 
 * Advanced product search endpoint using Elasticsearch
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchProducts } from '@/lib/search/elasticsearch-client'
import { getRequestLogger } from '@/lib/observability/logger'

const searchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  tags: z.string().optional(),
  sort: z
    .enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest'])
    .optional()
    .default('relevance'),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(24),
})

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const log = getRequestLogger(requestId)

  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const params = searchSchema.parse({
      q: searchParams.get('q'),
      category: searchParams.get('category'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      inStock: searchParams.get('inStock'),
      rating: searchParams.get('rating'),
      tags: searchParams.get('tags'),
      sort: searchParams.get('sort') || 'relevance',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '24',
    })

    log.info('Search request', {
      query: params.q,
      filters: {
        category: params.category,
        priceRange: params.minPrice || params.maxPrice
          ? { min: params.minPrice, max: params.maxPrice }
          : undefined,
        inStock: params.inStock,
        rating: params.rating,
        tags: params.tags,
      },
      sort: params.sort,
      page: params.page,
      requestId,
    })

    // Execute search
    const results = await searchProducts({
      query: params.q,
      filters: {
        categories: params.category?.split(',').filter(Boolean),
        priceRange:
          params.minPrice !== undefined && params.maxPrice !== undefined
            ? { min: params.minPrice, max: params.maxPrice }
            : undefined,
        inStock: params.inStock,
        rating: params.rating,
        tags: params.tags?.split(',').filter(Boolean),
      },
      sort: params.sort,
      from: (params.page - 1) * params.limit,
      size: params.limit,
    })

    log.info('Search completed', {
      query: params.q,
      resultsCount: results.products.length,
      totalResults: results.total,
      took: results.took,
      requestId,
    })

    return NextResponse.json(
      {
        products: results.products,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: results.total,
          totalPages: Math.ceil(results.total / params.limit),
        },
        aggregations: results.aggregations,
        took: results.took,
      },
      {
        headers: {
          'X-Request-ID': requestId,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    log.error('Search request failed', { error, requestId })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
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
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: { 'X-Request-ID': requestId },
      }
    )
  }
}

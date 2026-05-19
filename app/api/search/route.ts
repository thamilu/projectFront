/**
 * GET /api/search
 * 
 * Advanced product search endpoint using Elasticsearch
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints'
import { getRequestLogger } from '@/core/telemetry/logger'

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

    // Execute search via backend API
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.SEARCH, {
      params: {
        query: params.q,
        category: params.category,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        inStock: params.inStock,
        rating: params.rating,
        tags: params.tags,
        sort: params.sort,
        page: params.page - 1, // Spring Boot uses 0-based paging
        size: params.limit,
      }
    });

    const results = resp?.data ?? resp;

    log.info('Search completed', {
      query: params.q,
      resultsCount: results.content?.length ?? 0,
      totalResults: results.totalElements ?? 0,
      requestId,
    })

    return NextResponse.json(
      {
        products: results.content ?? [],
        pagination: {
          page: params.page,
          limit: params.limit,
          total: results.totalElements ?? 0,
          totalPages: results.totalPages ?? Math.ceil((results.totalElements ?? 0) / params.limit),
        },
        aggregations: results.aggregations,
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

/**
 * Elasticsearch Client for Advanced Product Search
 * 
 * Features:
 * - Full-text search with fuzzy matching
 * - Faceted search with aggregations
 * - Search suggestions and autocomplete
 * - Multi-field matching with boosting
 * - Search analytics
 */

import { Client } from '@elastic/elasticsearch'
import { logger } from '@/lib/observability/logger'

let _esClient: unknown = null
function getEsClient() {
  if (_esClient) return _esClient as Client
  const node = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
  const auth = process.env.ELASTICSEARCH_API_KEY
    ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
    : {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
      }

  _esClient = new Client({
    node,
    auth,
    requestTimeout: 30000,
    maxRetries: 3,
    sniffOnStart: false,
    sniffInterval: false,
  })

  return _esClient as Client
}

// Typed helpers to avoid `any` casts in mappings
type ESHit = {
  _id?: string
  _score?: number
  _source?: Record<string, unknown>
  highlight?: Record<string, unknown>
}

type ESBucket = {
  key?: string | number
  doc_count?: number
  category_name?: { buckets?: Array<{ key?: string }> }
}

type ESSuggestOption = { text?: string; _score?: number }


export interface SearchParams {
  query: string
  filters?: {
    categories?: string[]
    priceRange?: { min: number; max: number }
    inStock?: boolean
    rating?: number
    tags?: string[]
  }
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
  from?: number
  size?: number
}

export interface SearchResult {
  products: unknown[]
  total: number
  took: number
  aggregations?: {
    categories: Array<{ key: string; count: number }>
    priceRanges: Array<{ key: string; count: number }>
    ratings: Array<{ key: number; count: number }>
  }
}

/**
 * Search products with advanced filtering
 */
export async function searchProducts(
  params: SearchParams
): Promise<SearchResult> {
  try {
    const { query, filters, sort = 'relevance', from = 0, size = 24 } = params

    logger.info('Elasticsearch query', { query, filters, from, size })

    // Build query clauses
    const mustClauses: unknown[] = []
    const filterClauses: unknown[] = []

    // Text search with fuzzy matching
    if (query && query.trim()) {
      mustClauses.push({
        multi_match: {
          query: query.trim(),
          fields: [
            'name^3', // Boost product name
            'description^2', // Boost description
            'category.name^1.5',
            'tags',
            'brand',
          ],
          fuzziness: 'AUTO',
          operator: 'or',
          minimum_should_match: '75%',
        },
      })
    } else {
      // Match all if no query
      mustClauses.push({ match_all: {} })
    }

    // Category filter
    if (filters?.categories && filters.categories.length > 0) {
      filterClauses.push({
        terms: { 'category.id': filters.categories },
      })
    }

    // Price range filter
    if (filters?.priceRange) {
      filterClauses.push({
        range: {
          price: {
            gte: filters.priceRange.min,
            lte: filters.priceRange.max,
          },
        },
      })
    }

    // Stock filter
    if (filters?.inStock) {
      filterClauses.push({
        range: { stock: { gt: 0 } },
      })
    }

    // Rating filter
    if (filters?.rating) {
      filterClauses.push({
        range: { rating: { gte: filters.rating } },
      })
    }

    // Tags filter
    if (filters?.tags && filters.tags.length > 0) {
      filterClauses.push({
        terms: { tags: filters.tags },
      })
    }

    // Build sort configuration
    let sortConfig: unknown[] = []
    switch (sort) {
      case 'price_asc':
        sortConfig = [{ price: 'asc' }]
        break
      case 'price_desc':
        sortConfig = [{ price: 'desc' }]
        break
      case 'rating':
        sortConfig = [{ rating: 'desc' }, { reviewCount: 'desc' }]
        break
      case 'newest':
        sortConfig = [{ createdAt: 'desc' }]
        break
      case 'relevance':
      default:
        sortConfig = [{ _score: 'desc' }, { rating: 'desc' }]
    }

    // Execute search
    const response = await getEsClient().search({
      index: 'products',
      body: {
        from,
        size,
        query: {
          bool: {
            must: mustClauses,
            filter: filterClauses,
          },
        },
        sort: sortConfig,
        highlight: {
          fields: {
            name: { number_of_fragments: 0 },
            description: { number_of_fragments: 3, fragment_size: 150 },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
        aggs: {
          categories: {
            terms: {
              field: 'category.id',
              size: 20,
            },
            aggs: {
              category_name: {
                terms: {
                  field: 'category.name.keyword',
                  size: 1,
                },
              },
            },
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { key: 'Under $50', to: 50 },
                { key: '$50 - $100', from: 50, to: 100 },
                { key: '$100 - $200', from: 100, to: 200 },
                { key: '$200 - $500', from: 200, to: 500 },
                { key: 'Over $500', from: 500 },
              ],
            },
          },
          ratings: {
            histogram: {
              field: 'rating',
              interval: 1,
              min_doc_count: 1,
            },
          },
          avg_price: {
            avg: { field: 'price' },
          },
        },
      },
    })

    const results = {
      products: response.hits.hits.map((hit: unknown) => {
        const h = hit as ESHit
        return {
          ...(h._source ?? {}),
          id: h._id,
          score: h._score,
          highlight: h.highlight,
        }
      }),
      total: ((response.hits.total as unknown) as { value?: number }).value || 0,
      took: response.took,
      aggregations: {
        categories:
          response.aggregations?.categories?.buckets?.map((bucket: unknown) => {
            const b = bucket as ESBucket
            return {
              key: b.key,
              count: b.doc_count,
              name: b.category_name?.buckets?.[0]?.key,
            }
          }) || [],
        priceRanges:
          response.aggregations?.price_ranges?.buckets?.map((bucket: unknown) => {
            const b = bucket as ESBucket
            return { key: b.key, count: b.doc_count }
          }) || [],
        ratings:
          response.aggregations?.ratings?.buckets?.map((bucket: unknown) => {
            const b = bucket as ESBucket
            return { key: b.key as number | undefined, count: b.doc_count }
          }) || [],
      },
    }

    logger.info('Search completed', {
      query,
      resultsCount: results.products.length,
      total: results.total,
      took: results.took,
    })

    return results
  } catch (error) {
    logger.error('Elasticsearch query failed', { error: error instanceof Error ? error.message : String(error), params })
    throw error
  }
}

/**
 * Get search suggestions/autocomplete
 */
export async function suggestSearchTerms(query: string, size: number = 10) {
  try {
    const response = await getEsClient().search({
      index: 'products',
      body: {
        suggest: {
          product_suggest: {
            prefix: query,
            completion: {
              field: 'name_suggest',
              size,
              skip_duplicates: true,
              fuzzy: {
                fuzziness: 'AUTO',
                min_length: 3,
              },
            },
          },
        },
        // Also search for matching products
        query: {
          multi_match: {
            query,
            fields: ['name^3', 'category.name^2', 'tags'],
            type: 'bool_prefix',
          },
        },
        _source: ['name', 'category', 'price', 'images'],
        size: 5,
      },
    })

    const suggestions =
      response.suggest?.product_suggest?.[0]?.options?.map((opt: unknown) => {
        const o = opt as ESSuggestOption
        return { text: o.text, score: o._score }
      }) || []

    const products = response.hits?.hits?.map((hit: unknown) => {
      const h = hit as ESHit
      return { id: h._id, ...(h._source ?? {}) }
    }) || []

    return {
      suggestions,
      products,
    }
  } catch (error) {
    logger.error('Search suggestions failed', { error, query })
    return { suggestions: [], products: [] }
  }
}

/**
 * Index a product in Elasticsearch
 */
export async function indexProduct(productId: string, product: Record<string, unknown>) {
  try {
    // Index a single product
    await getEsClient().index({
      index: 'products',
      id: productId,
      body: {
        ...product,
        name_suggest: {
          input: [
            typeof product['name'] === 'string' ? (product['name'] as string) : '',
            ...((Array.isArray(product['tags']) ? (product['tags'] as string[]) : [])),
          ],
          weight: !!product['featured'] ? 10 : 1,
        },
        indexed_at: new Date().toISOString(),
      },
      refresh: true,
    });
    logger.info('Product indexed', { productId });
    return { success: true };
  } catch (error) {
    logger.error('Bulk index failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Delete product from index
 */
export async function deleteProduct(productId: string) {
  try {
    await getEsClient().delete({
      index: 'products',
      id: productId,
    })

    logger.info('Product deleted from index', { productId })
  } catch (error) {
    logger.error('Failed to delete product from index', { error, productId })
    throw error
  }
}

/**
 * Create products index with mapping
 */
export async function createProductsIndex() {
  try {
    await getEsClient().indices.create({
      index: 'products',
      body: {
        mappings: {
          properties: {
            name: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            name_suggest: {
              type: 'completion',
            },
            description: { type: 'text' },
            price: { type: 'double' },
            stock: { type: 'integer' },
            rating: { type: 'float' },
            reviewCount: { type: 'integer' },
            category: {
              properties: {
                id: { type: 'keyword' },
                name: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
              },
            },
            tags: { type: 'keyword' },
            brand: { type: 'keyword' },
            featured: { type: 'boolean' },
            status: { type: 'keyword' },
            createdAt: { type: 'date' },
            indexed_at: { type: 'date' },
          },
        },
        settings: {
          number_of_shards: 3,
          number_of_replicas: 1,
          analysis: {
            analyzer: {
              autocomplete: {
                tokenizer: 'autocomplete',
                filter: ['lowercase'],
              },
            },
            tokenizer: {
              autocomplete: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 10,
                token_chars: ['letter', 'digit'],
              },
            },
          },
        },
      },
    })

    logger.info('Products index created')
  } catch (error) {
    const err = error as { meta?: { body?: { error?: { type?: string } } } }
    if (err.meta?.body?.error?.type === 'resource_already_exists_exception') {
      logger.info('Products index already exists')
    } else {
      logger.error('Failed to create products index', { error })
      throw error
    }
  }
}

export { getEsClient }

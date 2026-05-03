/**
 * POST /api/payments/create-intent
 * 
 * Creates a Stripe payment intent for checkout
 * 
 * Request body:
 * - orderId: string
 * - amount: number
 * - currency: string (default: 'usd')
 * 
 * Response:
 * - clientSecret: string (for Stripe Elements)
 * - paymentIntentId: string
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'
import { createPaymentIntent } from '@/lib/payments/stripe-client'
import { getRequestLogger } from '@/lib/observability/logger'

const createIntentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive().max(999999),
  currency: z.string().length(3).default('usd'),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const log = getRequestLogger(requestId)

  try {
    // Verify authentication
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'X-Request-ID': requestId },
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = createIntentSchema.parse(body)

    log.info('Creating payment intent', {
      userId: token.sub,
      orderId: validated.orderId,
      amount: validated.amount,
      requestId,
    })

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount: validated.amount,
      currency: validated.currency,
      metadata: {
        orderId: validated.orderId,
        userId: token.sub!,
        userEmail: token.email || '',
      },
      customerId: (token as Record<string, unknown>).stripeCustomerId as string | undefined,
      description: validated.description || `Order ${validated.orderId}`,
      receiptEmail: token.email || undefined,
    })

    log.info('Payment intent created successfully', {
      paymentIntentId: paymentIntent.id,
      orderId: validated.orderId,
      requestId,
    })

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      {
        status: 201,
        headers: { 'X-Request-ID': requestId },
      }
    )
  } catch (error) {
    log.error('Failed to create payment intent', {
      error,
      requestId,
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
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
        error: 'Payment processing failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      {
        status: 500,
        headers: { 'X-Request-ID': requestId },
      }
    )
  }
}

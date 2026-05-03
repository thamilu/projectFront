/**
 * Stripe Payment Integration Client
 * 
 * Handles all Stripe payment operations including:
 * - Payment intent creation
 * - Payment confirmation
 * - Refunds
 * - Customer management
 */

import Stripe from 'stripe'
import { logger } from '@/lib/observability/logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _stripe: any | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureStripe(): any {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Stripe not configured: STRIPE_SECRET_KEY is missing')
  }
  _stripe = new Stripe(key, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
    appInfo: {
      name: 'Enterprise E-Commerce Platform',
      version: '1.0.0',
    },
  })
  return _stripe
}

export interface CreatePaymentIntentParams {
  amount: number
  currency: string
  metadata: Record<string, string>
  customerId?: string
  description?: string
  receiptEmail?: string
}

export interface CreateCustomerParams {
  email: string
  name: string
  metadata?: Record<string, string>
}

/**
 * Create a new payment intent for checkout
 */
export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  try {
    logger.info('Creating payment intent', {
      amount: params.amount,
      currency: params.currency,
      customerId: params.customerId,
    })

    const stripe = ensureStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: params.metadata,
      customer: params.customerId,
      description: params.description,
      receipt_email: params.receiptEmail,
      // Enable capture later for order fulfillment workflow
      capture_method: 'automatic',
    })

    logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    })

    return paymentIntent
  } catch (error) {
    logger.error('Failed to create payment intent', {
      error,
      params,
    })
    throw error
  }
}

/**
 * Confirm a payment intent (server-side confirmation)
 */
export async function confirmPayment(
  paymentIntentId: string,
  paymentMethod?: string
) {
  try {
    logger.info('Confirming payment', { paymentIntentId })

    const stripe = ensureStripe()
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod,
    })

    logger.info('Payment confirmed', {
      paymentIntentId,
      status: paymentIntent.status,
    })

    return paymentIntent
  } catch (error) {
    logger.error('Failed to confirm payment', {
      error,
      paymentIntentId,
    })
    throw error
  }
}

/**
 * Retrieve payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const stripe = ensureStripe()
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    logger.error('Failed to retrieve payment intent', {
      error,
      paymentIntentId,
    })
    throw error
  }
}

/**
 * Create a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  try {
    logger.info('Creating refund', {
      paymentIntentId,
      amount,
      reason,
    })

    const stripe = ensureStripe()
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    })

    logger.info('Refund created', {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
    })

    return refund
  } catch (error) {
    logger.error('Failed to create refund', {
      error,
      paymentIntentId,
    })
    throw error
  }
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(params: CreateCustomerParams) {
  try {
    logger.info('Creating Stripe customer', { email: params.email })

    const stripe = ensureStripe()
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    })

    logger.info('Stripe customer created', { customerId: customer.id })

    return customer
  } catch (error) {
    logger.error('Failed to create Stripe customer', {
      error,
      params,
    })
    throw error
  }
}

/**
 * Retrieve customer details
 */
export async function getCustomer(customerId: string) {
  try {
    const stripe = ensureStripe()
    return await stripe.customers.retrieve(customerId)
  } catch (error) {
    logger.error('Failed to retrieve customer', {
      error,
      customerId,
    })
    throw error
  }
}

/**
 * Update customer details
 */
export async function updateCustomer(
  customerId: string,
  params: Partial<CreateCustomerParams>
) {
  try {
    const stripe = ensureStripe()
    return await stripe.customers.update(customerId, params)
  } catch (error) {
    logger.error('Failed to update customer', {
      error,
      customerId,
    })
    throw error
  }
}

/**
 * List customer payment methods
 */
export async function listPaymentMethods(customerId: string) {
  try {
    const stripe = ensureStripe()
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    return paymentMethods.data
  } catch (error) {
    logger.error('Failed to list payment methods', {
      error,
      customerId,
    })
    throw error
  }
}

/**
 * Capture a payment intent (for manual capture)
 */
export async function capturePayment(
  paymentIntentId: string,
  amount?: number
) {
  try {
    logger.info('Capturing payment', { paymentIntentId, amount })

    const stripe = ensureStripe()
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: amount ? Math.round(amount * 100) : undefined,
    })

    logger.info('Payment captured', {
      paymentIntentId,
      status: paymentIntent.status,
    })

    return paymentIntent
  } catch (error) {
    logger.error('Failed to capture payment', {
      error,
      paymentIntentId,
    })
    throw error
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPayment(paymentIntentId: string) {
  try {
    logger.info('Canceling payment', { paymentIntentId })

    const stripe = ensureStripe()
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId)

    logger.info('Payment canceled', { paymentIntentId })

    return paymentIntent
  } catch (error) {
    logger.error('Failed to cancel payment', {
      error,
      paymentIntentId,
    })
    throw error
  }
}

export { ensureStripe as getStripe }

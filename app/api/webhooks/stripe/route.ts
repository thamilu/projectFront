/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events for payment processing
 *
 * Events handled:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - payment_intent.canceled
 * - charge.refunded
 * - customer.created
 * - customer.updated
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/payments/stripe-client';
import { getRequestLogger } from '@/lib/observability/logger';
import { apiClient } from '@/lib/http/services';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Verify webhook signature and construct event
 */
 
function constructEvent(
  body: string,
  signature: string,
  log: ReturnType<typeof getRequestLogger>
): any {
  try {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    log.error('Webhook signature verification failed', { error });
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Handle payment_intent.succeeded event
 */
 
async function handlePaymentSucceeded(
  paymentIntent: any,
  log: ReturnType<typeof getRequestLogger>
) {
  const orderId = paymentIntent.metadata?.orderId;

  const amountNumber = typeof paymentIntent.amount === 'number' ? paymentIntent.amount : 0;

  log.info('Payment succeeded', {
    paymentIntentId: paymentIntent.id,
    orderId,
    amount: amountNumber / 100,
  });

  // Update order status in database
  try {
    await apiClient.patch(`/orders/${orderId}/payment-status`, {
      status: 'PAID',
      paymentIntentId: paymentIntent.id,
      paidAt: new Date().toISOString(),
    }, {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
    });

    log.info('Order payment status updated', { orderId });
  } catch (error) {
    log.error('Failed to update order after payment success', {
      error,
      orderId,
      paymentIntentId: paymentIntent.id,
    });
    // Don't throw - we don't want to reject the webhook
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(paymentIntent: any, log: ReturnType<typeof getRequestLogger>) {
  const orderId = paymentIntent.metadata?.orderId;

  const lastPaymentErrorMsg = paymentIntent.last_payment_error?.message || '';

  log.warn('Payment failed', {
    paymentIntentId: paymentIntent.id,
    orderId,
    lastPaymentError: lastPaymentErrorMsg,
  });

  try {
    await apiClient.patch(`/orders/${orderId}/payment-status`, {
      status: 'PAYMENT_FAILED',
      paymentIntentId: paymentIntent?.id,
      failureReason: lastPaymentErrorMsg,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
    });
  } catch (error) {
    log.error('Failed to update order after payment failure', {
      error,
      orderId,
    });
  }
}

/**
 * Handle payment_intent.canceled event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentCanceled(paymentIntent: any, log: ReturnType<typeof getRequestLogger>) {
  const orderId = paymentIntent.metadata?.orderId;

  log.info('Payment canceled', {
    paymentIntentId: paymentIntent.id,
    orderId,
  });

  try {
    await apiClient.patch(`/orders/${orderId}/payment-status`, {
      status: 'PAYMENT_CANCELED',
      paymentIntentId: paymentIntent?.id,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
    });
  } catch (error) {
    log.error('Failed to update order after payment cancellation', {
      error,
      orderId,
    });
  }
}

/**
 * Handle charge.refunded event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleChargeRefunded(charge: any, log: ReturnType<typeof getRequestLogger>) {
  const orderId = charge.metadata?.orderId;

  const refundNumber = typeof charge.amount_refunded === 'number' ? charge.amount_refunded : 0;

  log.info('Refund processed', {
    chargeId: charge.id,
    orderId,
    amount: refundNumber / 100,
  });

  try {
    await apiClient.patch(`/orders/${orderId}/payment-status`, {
      status: 'REFUNDED',
      refundedAt: new Date().toISOString(),
      refundAmount: refundNumber / 100,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
      },
    });
  } catch (error) {
    log.error('Failed to update order after refund', {
      error,
      orderId,
    });
  }
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = getRequestLogger(requestId);

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      log.error('Missing Stripe signature header', { requestId });
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const event = constructEvent(body, signature, log);

    log.info('Webhook event received', {
      type: event?.type,
      eventId: event?.id,
      requestId,
    });

    // Handle events
    switch (event.type) {
      case 'payment_intent.succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentIntent = event.data.object as any;
        await handlePaymentSucceeded(paymentIntent, log);
        break;
      }

      case 'payment_intent.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentIntent = event.data.object as any;
        await handlePaymentFailed(paymentIntent, log);
        break;
      }

      case 'payment_intent.canceled': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentIntent = event.data.object as any;
        await handlePaymentCanceled(paymentIntent, log);
        break;
      }

      case 'charge.refunded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const charge = event.data.object as any;
        await handleChargeRefunded(charge, log);
        break;
      }

      case 'customer.created':
      case 'customer.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customer = event.data.object as any;
        log.info('Customer event', {
          type: event.type,
          customerId: customer.id,
        });
        break;
      }

      default:
        log.info('Unhandled webhook event type', {
          type: event.type,
          requestId,
        });
    }

    return NextResponse.json(
      { received: true },
      {
        status: 200,
        headers: { 'X-Request-ID': requestId },
      }
    );
  } catch (error) {
    log.error('Webhook processing failed', {
      error,
      requestId,
    });

    if (error instanceof Error && error.message === 'Invalid webhook signature') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

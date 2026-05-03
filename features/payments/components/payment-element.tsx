/**
 * PaymentElement Component
 * 
 * Stripe Payment Element integration for checkout
 * Handles payment form, submission, and error states
 */

'use client'

import { useState, FormEvent } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/observability/logger'

interface PaymentFormProps {
  amount: number
  orderId: string
  onSuccess: (paymentIntentId: string) => void
  onError?: (error: Error) => void
}

export function PaymentForm({
  amount,
  orderId,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentComplete, setPaymentComplete] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      logger.info('Processing payment', { orderId, amount })

      // Confirm payment with Stripe
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
        },
        redirect: 'if_required',
      })

      if (submitError) {
        // Payment failed
        const errorMessage =
          submitError.message || 'An error occurred during payment processing'
        setError(errorMessage)
        toast.error(errorMessage)
        logger.error('Payment confirmation failed', {
          error: submitError,
          orderId,
        })

        if (onError) {
          onError(new Error(errorMessage))
        }
      } else if (paymentIntent) {
        // Payment succeeded
        if (paymentIntent.status === 'succeeded') {
          setPaymentComplete(true)
          toast.success('Payment successful!')
          logger.info('Payment succeeded', {
            paymentIntentId: paymentIntent.id,
            orderId,
          })

          // Call success callback
          onSuccess(paymentIntent.id)
        } else if (paymentIntent.status === 'requires_action') {
          // Additional authentication required (3D Secure)
          toast.info('Additional authentication required')
        } else {
          setError('Payment processing incomplete')
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
      logger.error('Payment processing error', { error: err, orderId })

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (paymentComplete) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          Payment completed successfully! Redirecting...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
          <p className="text-sm text-muted-foreground mb-4">
            All transactions are secure and encrypted
          </p>
        </div>

        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'paypal'],
          }}
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold">
            ${amount.toFixed(2)}
          </span>
        </div>

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          By completing this purchase you agree to our{' '}
          <a href="/terms" className="underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </form>
  )
}

/**
 * Saved payment methods component
 */
interface SavedPaymentMethodsProps {
  customerId: string
  onSelect: (paymentMethodId: string) => void
}

export function SavedPaymentMethods({
  customerId: _customerId,
  onSelect: _onSelect,
}: SavedPaymentMethodsProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [_methods, _setMethods] = useState<any[]>([])
  const [_loading, _setLoading] = useState(true)

  // Fetch saved payment methods
  // Implementation depends on your API structure

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Saved Payment Methods</h3>
      {/* Render saved cards */}
    </div>
  )
}

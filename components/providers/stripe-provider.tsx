/**
 * Stripe Provider Component
 * 
 * Wraps the application with Stripe Elements provider
 * Provides Stripe context to all child components
 */

'use client'

import { ReactNode } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { logger } from '@/lib/observability/logger'

// Initialize Stripe outside component to avoid recreating on each render
let stripePromise: Promise<Stripe | null> | null = null

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      logger.error('Stripe publishable key not configured')
      return null
    }

    stripePromise = loadStripe(publishableKey, {
      // Optional: Configure Stripe.js options
      locale: 'auto',
    })
  }
  return stripePromise
}

interface StripeProviderProps {
  children: ReactNode
}

/**
 * Basic Stripe provider without payment intent
 */
export function StripeProvider({ children }: StripeProviderProps) {
  const stripe = getStripe()

  if (!stripe) {
    return <>{children}</>
  }

  return (
    <Elements
      stripe={stripe}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0070f3',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#df1b41',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      }}
    >
      {children}
    </Elements>
  )
}

interface CheckoutStripeProviderProps {
  clientSecret: string
  children: ReactNode
}

/**
 * Stripe provider configured for checkout with payment intent
 */
export function CheckoutStripeProvider({
  clientSecret,
  children,
}: CheckoutStripeProviderProps) {
  const stripe = getStripe()

  if (!stripe) {
    return <>{children}</>
  }

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0070f3',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#df1b41',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
        loader: 'auto',
      }}
    >
      {children}
    </Elements>
  )
}

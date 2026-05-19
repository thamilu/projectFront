/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'stripe' {
  // Minimal ambient types for Stripe to satisfy TypeScript in the frontend
  const Stripe: any
  export default Stripe
}

declare module '@stripe/react-stripe-js' {
  // Minimal ambient types for react-stripe-js used in the frontend
  export const Elements: any
  export const useStripe: any
  export const useElements: any
  export const PaymentElement: any
  export default {} as any
}
declare namespace Stripe {
  export interface Event<T = any> {
    id?: string
    type: string
    data: {
      object: T
    }
  }

  export interface PaymentIntent {
    id: string
    amount: number
    amount_received?: number
    currency?: string
    metadata: { [key: string]: string }
    last_payment_error?: { message?: string }
    status?: string
  }

  export interface Charge {
    id: string
    amount_refunded: number
    metadata: { [key: string]: string }
  }

  export interface Customer {
    id: string
  }
}

declare module 'stripe' {
  // import StripeType = Stripe
  const Stripe: any
  export default Stripe
  export = Stripe
}

declare module '@stripe/stripe-js' {
  export type Stripe = any
  export function loadStripe(key?: string, options?: any): Promise<Stripe | null>
}

declare module '@stripe/react-stripe-js' {
  export const Elements: any
  export const useStripe: () => any
  export const useElements: () => any
  export const PaymentElement: any
  const _default: any
  export default _default
}

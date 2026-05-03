/**
 * Payment-related type definitions
 */

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethodId?: string
  customerId?: string
  metadata: Record<string, string>
  createdAt: string
}

export enum PaymentStatus {
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  REQUIRES_CAPTURE = 'requires_capture',
  CANCELED = 'canceled',
  SUCCEEDED = 'succeeded',
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'bank_account'
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  billingDetails?: {
    name?: string
    email?: string
    phone?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postalCode?: string
      country?: string
    }
  }
  isDefault: boolean
  createdAt: string
}

export interface Refund {
  id: string
  paymentIntentId: string
  amount: number
  currency: string
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  createdAt: string
}

export interface PaymentError {
  code: string
  message: string
  type: 'api_error' | 'card_error' | 'invalid_request_error'
  declineCode?: string
  param?: string
}

export interface CreatePaymentIntentRequest {
  orderId: string
  amount: number
  currency?: string
  description?: string
}

export interface CreatePaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
}

export interface PaymentHistoryItem {
  id: string
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod?: string
  last4?: string
  createdAt: string
  receiptUrl?: string
}

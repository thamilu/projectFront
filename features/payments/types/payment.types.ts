/**
 * Re-export payment types from the centralized payments domain context
 * to enforce strict DRY principles and prevent DTO/type duplication.
 */

export {
  PaymentStatus,
  type PaymentIntent,
  type PaymentMethod,
  type Refund,
  type PaymentError,
  type CreatePaymentIntentRequest,
  type CreatePaymentIntentResponse,
  type PaymentHistoryItem,
} from '@/domains/payments/contracts/payment.types';

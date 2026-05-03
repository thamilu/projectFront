/**
 * Custom hook for managing payment intents
 */

'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api as apiClient } from '@/lib/api-client'
import {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PaymentIntent,
} from '../types/payment.types'
import { logger } from '@/lib/observability/logger'
import { toast } from 'sonner'

export function usePaymentIntent() {
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  /**
   * Create a new payment intent
   */
  const createIntent = useMutation({
    mutationFn: async (data: CreatePaymentIntentRequest) => {
      logger.info('Creating payment intent', { orderId: data.orderId })

      const response = await apiClient.post<CreatePaymentIntentResponse>(
        '/api/payments/create-intent',
        {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency || 'usd',
          description: data.description,
        }
      )

      return response.data
    },
    onSuccess: (data) => {
      if (!data) return
      setPaymentIntentId(data.paymentIntentId)
      logger.info('Payment intent created', {
        paymentIntentId: data.paymentIntentId,
      })
    },
    onError: (error) => {
      logger.error('Failed to create payment intent', { error })
      toast.error('Failed to initialize payment')
    },
  })

  /**
   * Retrieve payment intent details
   */
  const { data: paymentIntent, isLoading: isLoadingIntent } = useQuery<PaymentIntent | null, Error>({
    queryKey: ['paymentIntent', paymentIntentId],
    queryFn: async () => {
      if (!paymentIntentId) return null

      const response = await apiClient.get<PaymentIntent>(
        `/api/payments/intent/${paymentIntentId}`
      )

      return response?.data ?? null
    },
    enabled: !!paymentIntentId,
  })

  /**
   * Cancel payment intent
   */
  const cancelIntent = useMutation({
    mutationFn: async (intentId: string) => {
      logger.info('Canceling payment intent', { paymentIntentId: intentId })

      const response = await apiClient.post(
        `/api/payments/intent/${intentId}/cancel`
      )

      return response.data
    },
    onSuccess: () => {
      toast.success('Payment canceled')
      setPaymentIntentId(null)
    },
    onError: (error) => {
      logger.error('Failed to cancel payment intent', { error })
      toast.error('Failed to cancel payment')
    },
  })

  return {
    // State
    paymentIntentId,
    paymentIntent,
    isLoadingIntent,

    // Mutations
    createPaymentIntent: createIntent.mutate,
    isCreatingIntent: createIntent.isPending,
    cancelPaymentIntent: cancelIntent.mutate,
    isCancelingIntent: cancelIntent.isPending,
  }
}

/**
 * Hook for payment history
 */
export function usePaymentHistory() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: async () => {
      const response = await apiClient.get('/api/payments/history')
      return response.data
    },
  })

  return {
    payments,
    isLoading,
  }
}

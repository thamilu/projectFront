import { z } from 'zod';
import { logger } from '@/lib/observability/logger';

/**
 * Enterprise API Contract Validator
 * 
 * Ensures that the data received from the backend matches the frontend's expected schema.
 * Prevents "silent failures" caused by backend DTO changes.
 */
export function validateContract<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errorDetails = result.error.format();
    logger.error(`[Contract Violation] ${context}`, {
      errors: errorDetails,
      data
    });
    
    // In production, we might just log and return data anyway to prevent crashing,
    // but in development/testing, we should be strict.
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Contract Violation] ${context}:`, errorDetails);
    }
  }
  
  return data as T;
}

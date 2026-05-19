import { env } from '@/env'

/**
 * Configuration for distributed tracing propagation.
 * Ensures correlation IDs and trace context are shared with the Spring Boot backend.
 */
export const tracingConfig = {
  // Add your backend origins here to enable trace header propagation
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/api\.eshop\.com/,
    new URL(env.SPRING_BOOT_API_URL).hostname,
  ],
  
  // Custom headers to propagate
  customHeaders: [
    'X-Correlation-ID',
    'X-Request-ID',
  ],
}

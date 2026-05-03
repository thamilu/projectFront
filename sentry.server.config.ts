// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Ignore errors from health check endpoints
  ignoreErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],

  // Filter transactions
  beforeSendTransaction(event) {
    // Don't send transactions for health check endpoints
    if (event.transaction?.includes('/health') || event.transaction?.includes('/api/health')) {
      return null;
    }
    return event;
  },

  // Enrich error events
  beforeSend(event, hint) {
    // Add additional context for server-side errors
    if (event.request) {
      // Log the full request for debugging
      console.error('Sentry capturing error:', {
        url: event.request.url,
        method: event.request.method,
        error: hint.originalException,
      });
    }
    return event;
  },
});

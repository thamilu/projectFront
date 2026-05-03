// This file configures the initialization of Sentry on the client side.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay session sampling
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
  replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 0.5,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    // Browser tracing integration (no extra options to satisfy types)
    Sentry.browserTracingIntegration(),
  ],

  // Ignore common errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'Non-Error promise rejection captured',
    // Network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // Random plugins/extensions
    'window.webkit',
    'jigsaw is not defined',
    'ComboSearch is not defined',
  ],

  // Enrich error events with user context
  beforeSend(event, _hint) {
    // Filter out events from browser extensions
    if (event.exception) {
      const values = event.exception.values || [];
      if (values.some((value) => {
        const stacktrace = value.stacktrace?.frames || [];
        return stacktrace.some((frame) => 
          frame.filename?.includes('chrome-extension://') ||
          frame.filename?.includes('moz-extension://')
        );
      })) {
        return null; // Don't send extension errors
      }
    }

    return event;
  },
});

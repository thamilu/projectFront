'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/atoms/button/button';
import { AlertTriangle, Check, Copy, Home, RefreshCw } from 'lucide-react';
import { logger } from '@/core/telemetry/logger';
import { recordMetric } from '@/core/telemetry/metrics';
import { APP_ROUTES } from '@/shared/routes';

interface ProfileErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Matches app/(auth)/login/error.tsx's retry-limiting convention: past this
// many attempts, a persistently-failing condition (e.g. a real outage)
// isn't going to be fixed by clicking the same button again, and each
// click was re-firing the telemetry effect below with no limit — a
// frustrated user clicking rapidly during an incident was generating
// unbounded duplicate log/metric entries at exactly the moment clean
// signal matters most.
const MAX_RETRIES = 3;

export default function ProfileError({ error, reset }: ProfileErrorProps) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors retryCount for the logging effect below without making it a
  // dependency: this effect must fire exactly once per DISTINCT error
  // occurrence (keyed on `error` alone). Adding retryCount as a dependency
  // would re-fire it on every retry-count state update too — logging the
  // same, unchanged error a second time — which is the opposite of what
  // capping retries is meant to fix.
  const retryCountRef = useRef(0);

  useEffect(() => {
    // 🏢 ENTERPRISE: Graceful Telemetry & Error monitoring
    logger.error('Profile page runtime error occurred', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      retryCount: retryCountRef.current,
    });

    recordMetric('profile_page_error_count', 1, {
      digest: error.digest || 'unknown',
    });
  }, [error]);

  useEffect(() => {
    // Moves focus to the heading so keyboard and screen reader users are
    // actually informed an error occurred — matches the established
    // pattern in app/(auth)/login/error.tsx. Without this, focus stays
    // wherever it was on the now-replaced page, and there's no live
    // region either, so assistive tech users would otherwise have zero
    // indication anything happened.
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount((count) => {
      const next = count + 1;
      retryCountRef.current = next;
      return next;
    });
    reset();
  }, [reset]);

  const handleCopyDigest = useCallback(() => {
    if (!error.digest) return;
    navigator.clipboard.writeText(error.digest);
    setCopied(true);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [error.digest]);

  const retriesExhausted = retryCount >= MAX_RETRIES;

  return (
    <div className="animate-in fade-in zoom-in-95 container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16 duration-300">
      <div className="bg-card/65 border-destructive/20 w-full max-w-xl overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md">
        {/* Top Decorative Border */}
        <div className="bg-destructive/80 h-2" />

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-destructive/10 text-destructive mb-6 motion-safe:animate-bounce rounded-full p-4 shadow-inner">
              <AlertTriangle className="h-10 w-10" aria-hidden="true" />
            </div>

            <h1 ref={headingRef} tabIndex={-1} className="text-foreground mb-3 text-2xl font-bold">
              Something went wrong
            </h1>

            <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">
              {retriesExhausted
                ? "Still having trouble? This looks like it isn't resolving on its own — please contact support with the Error ID below."
                : 'We encountered an unexpected error while rendering your profile. Our system engineers have been notified automatically.'}
            </p>

            {error.digest && (
              <div className="bg-muted/40 border-muted/80 text-muted-foreground/80 mb-8 flex w-full items-center justify-center gap-1.5 rounded-lg border p-3.5 font-mono text-xs shadow-inner">
                <span className="text-foreground/80 font-semibold">Error ID:</span>
                <span className="select-all">{error.digest}</span>
                <button
                  type="button"
                  onClick={handleCopyDigest}
                  aria-label={copied ? 'Copied error ID' : 'Copy error ID'}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring ml-1 rounded p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {copied ? (
                    <Check className="text-success h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                onClick={handleRetry}
                disabled={retriesExhausted}
                variant="outline"
                className="border-border/80 hover:bg-muted h-11 w-full px-6 font-semibold transition-all sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                {retriesExhausted ? 'Max retries reached' : 'Try again'}
              </Button>
              <Button
                onClick={() => router.push(APP_ROUTES.HOME)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 w-full px-6 font-semibold shadow-md transition-all sm:w-auto"
              >
                <Home className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

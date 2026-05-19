"use client";
import React from 'react';
import { ErrorFallback } from '@/shared/ui/feedback/error-fallback';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} />;
}

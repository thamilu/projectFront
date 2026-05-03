import React from 'react';
import ErrorFallback from '@/components/shared/ErrorFallback';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      className="bg-background/50"
    />
  );
}

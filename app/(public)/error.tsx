'use client';

import React from 'react';
import { ErrorFallback } from '@/shared/components';

export default function ShopError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      className="bg-background/50"
    />
  );
}

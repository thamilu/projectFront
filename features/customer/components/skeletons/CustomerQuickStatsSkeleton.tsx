import React from 'react';

export function CustomerQuickStatsSkeleton(): React.JSX.Element {
  return (
    <div
      className="container mx-auto space-y-6 py-6"
      role="status"
      aria-label="Loading your account statistics"
    >
      <div className="bg-muted h-40 w-full animate-pulse rounded-3xl" />
    </div>
  );
}

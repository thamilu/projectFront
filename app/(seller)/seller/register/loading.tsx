import React from 'react';

export default function SellerOnboardingLoading(): React.JSX.Element {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 dark:from-gray-950 dark:to-gray-900"
      aria-busy="true"
      aria-label="Loading seller onboarding page"
    >
      <div className="container mx-auto px-4">
        <div className="mb-8 space-y-4 text-center">
          <div className="mx-auto h-10 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mx-auto h-6 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mx-auto max-w-lg">
          <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

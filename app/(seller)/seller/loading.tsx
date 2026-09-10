/**
 * Loading state for the seller dashboard.
 * Displayed while routing transitions occur or during Suspense data resolution.
 * Uses semantic design system tokens for consistent aesthetics.
 */
export default function SellerLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50/40 dark:bg-gray-900/40">
      {/* Header Skeleton */}
      <div className="h-16 animate-pulse border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" />

      <div className="flex pt-16">
        {/* Sidebar Skeleton */}
        <aside className="hidden w-64 animate-pulse border-r border-gray-200 bg-white md:block dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-4 p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={`sidebar-loading-item-${i}`}
                className="rounded-button h-10 bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        </aside>

        {/* Main Content Skeleton */}
        {/* Plain <div>: the root layout owns the only main landmark. */}
        <div className="ml-0 flex-1 p-6 transition-[margin-left] duration-300 md:ml-64 md:p-8">
          <div className="animate-pulse space-y-6">
            {/* Page Title */}
            <div className="rounded-button h-8 w-1/3 bg-gray-200 dark:bg-gray-700" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={`stats-loading-card-${i}`}
                  className="rounded-card h-32 bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>

            {/* Main Content Area */}
            <div className="rounded-card h-96 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

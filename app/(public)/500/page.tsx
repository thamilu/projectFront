'use client';

import { useRouter } from 'next/navigation';
import { ServerCrash } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/routes';

// This is a static informational page, not a Next.js error.tsx boundary —
// it never receives a real `error`/`reset` from the framework (that's what
// app/(public)/error.tsx is for). "Try again" here re-runs the current
// route via router.refresh() instead, which is the honest equivalent for a
// page with no real error object to retry from.
export default function ServerErrorPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4 text-center dark:from-slate-950 dark:to-red-950">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
        <ServerCrash className="h-10 w-10 text-red-600 dark:text-red-400" aria-hidden="true" />
      </div>

      <h1 className="mb-2 text-6xl font-extrabold text-red-600 dark:text-red-400">500</h1>
      <h2 className="mb-3 text-2xl font-bold text-slate-800 dark:text-slate-200">
        Internal Server Error
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Something went wrong on our end. Our team has been notified. Please try again in a moment.
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button onClick={() => router.refresh()}>Try again</Button>
        <Button variant="outline" onClick={() => router.push(APP_ROUTES.HOME)}>
          Go to homepage
        </Button>
      </div>
    </div>
  );
}

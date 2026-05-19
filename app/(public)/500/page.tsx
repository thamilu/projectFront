'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ServerCrash } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

export default function ServerErrorPage() {
  const error = undefined as (Error & { digest?: string }) | undefined;
  const reset = undefined as (() => void) | undefined;

  const router = useRouter();

  useEffect(() => {
    if (error) {
      console.error('[500]', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4 text-center dark:from-slate-950 dark:to-red-950">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
        <ServerCrash className="h-10 w-10 text-red-600 dark:text-red-400" />
      </div>

      <h1 className="mb-2 text-6xl font-extrabold text-red-600 dark:text-red-400">500</h1>
      <h2 className="mb-3 text-2xl font-bold text-slate-800 dark:text-slate-200">
        Internal Server Error
      </h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Something went wrong on our end. Our team has been notified. Please try again in a moment.
      </p>

      {error?.digest && (
        <p className="mb-6 rounded-md bg-muted px-4 py-2 font-mono text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {reset && (
          <Button onClick={reset}>
            Try again
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push(APP_ROUTES.HOME)}>
          Go to homepage
        </Button>
      </div>
    </div>
  );
}

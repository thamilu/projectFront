'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/atoms/button/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/shared/routes';

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Store Page Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center p-4">
      <Card className="border-destructive/20 bg-background/50 w-full max-w-md shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 text-destructive mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertCircle className="h-10 w-10" />
          </div>
          <CardTitle as="h1" className="text-2xl font-bold">
            Store Not Accessible
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            We encountered an error while trying to load this store's profile.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted max-h-32 overflow-auto rounded-lg p-4 text-left font-mono text-xs">
              {error.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={() => reset()} className="h-11 w-full" variant="default">
            <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
          <Button
            onClick={() => router.push(APP_ROUTES.HOME)}
            className="h-11 w-full"
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" /> Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

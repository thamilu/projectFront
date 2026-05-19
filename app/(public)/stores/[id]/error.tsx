'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

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
      <Card className="w-full max-w-md border-destructive/20 shadow-2xl bg-background/50 backdrop-blur-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold">Store Not Accessible</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            We encountered an error while trying to load this store's profile.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-muted p-4 text-left text-xs font-mono overflow-auto max-h-32">
              {error.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full h-11" variant="default">
            <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
          <Button 
            onClick={() => router.push(APP_ROUTES.HOME)} 
            className="w-full h-11" 
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" /> Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

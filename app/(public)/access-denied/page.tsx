/**
 * Access Denied Page
 *
 * Shown when user tries to access a protected route without required permissions
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { AlertCircle, Home, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { APP_ROUTES } from '@/shared/routes';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleGoHome = () => {
    router.push(APP_ROUTES.HOME);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: APP_ROUTES.AUTH_LOGIN });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4 dark:from-gray-950 dark:to-gray-900">
      <Card className="w-full max-w-md border-2 border-red-500">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle as="h1" className="text-2xl text-red-900 dark:text-red-100">
                Access Denied
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                Insufficient permissions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              You do not have permission to access this page.
            </p>

            {session?.user ? (
              <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Logged in as:</strong> {session.user.email || session.user.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Your roles:</strong>{' '}
                  {session.roles?.length ? session.roles.join(', ') : 'None'}
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  You are not logged in. Please sign in to access protected resources.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button onClick={handleGoHome} className="w-full" variant="default">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>

            {session?.user && (
              <Button onClick={handleSignOut} className="w-full" variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              If you believe this is an error, please contact your administrator or sign in with an
              account that has the required permissions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Access Denied Page
 * 
 * Shown when user tries to access a protected route without required permissions
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, LogOut } from 'lucide-react';
import { logoutAndRedirect } from '@/lib/auth/client-logout';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { data: session } = useSession();

  /* console.log removed */

  const handleGoHome = () => {
    /* console.log removed */
    router.push(APP_ROUTES.HOME);
  };

  const handleSignOut = async () => {
    /* console.log removed */
    await logoutAndRedirect({ redirectTo: APP_ROUTES.AUTH_LOGIN });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-red-500">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-red-900 dark:text-red-100">
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
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Logged in as:</strong> {session.user.email || session.user.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Your roles:</strong> {session.roles?.length ? session.roles.join(', ') : 'None'}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  You are not logged in. Please sign in to access protected resources.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleGoHome}
              className="w-full"
              variant="default"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
            
            {session?.user && (
              <Button 
                onClick={handleSignOut}
                className="w-full"
                variant="outline"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              If you believe this is an error, please contact your administrator or sign in with an account that has the required permissions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

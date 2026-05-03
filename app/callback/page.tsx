// src/app/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { setUser, setTokens, setAuthenticated } = useAuthStore();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams?.get('code');
        const state = searchParams?.get('state');
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');
        
        if (errorParam) {
          setError(errorDescription || errorParam);
          toast.error(errorDescription || 'Authentication failed');
          setTimeout(() => router.push(APP_ROUTES.AUTH_LOGIN), 3000);
          return;
        }
        
        if (!code || !state) {
          setError('Missing required parameters');
          toast.error('Invalid callback parameters');
          setTimeout(() => router.push(APP_ROUTES.AUTH_LOGIN), 3000);
          return;
        }
        
        // Exchange code for tokens
        const tokenResponse = await authService.handleCallback(code, state);
        
        // Set tokens
        setTokens(tokenResponse.access_token, tokenResponse.refresh_token);
        
        // Fetch user info
        const userInfo = await authService.getCurrentUser();
        setUser(userInfo);
        setAuthenticated(true);
        
        toast.success('Login successful!');
        router.push(APP_ROUTES.DASHBOARD);
      } catch (err: unknown) {
        logger.error('Callback error:', err);
        const message = (err as Error).message || 'Authentication failed';
        setError(message);
        toast.error(message);
        setTimeout(() => router.push(APP_ROUTES.AUTH_LOGIN), 3000);
      }
    };
    
    handleCallback();
  }, [searchParams, router, setUser, setTokens, setAuthenticated]);
  
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">
            Authentication Failed
          </div>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <div className="text-lg font-semibold">Processing login...</div>
        <p className="text-sm text-muted-foreground">
          Please wait while we complete your authentication
        </p>
      </div>
    </div>
  );
}

import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SellerFormStatus } from '../hooks/use-seller-status';

interface SellerStatusViewProps {
  status: Extract<SellerFormStatus, 'PENDING' | 'SUCCESS'>;
  hasSellerRole: boolean;
}

export function SellerStatusView({ status, hasSellerRole }: SellerStatusViewProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center space-y-6"
      >
        <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/20">
          {status === 'SUCCESS' ? (
            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
          ) : (
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 dark:text-blue-500" />
          )}
        </div>
        <h2 className="text-3xl font-bold tracking-tight">
          {status === 'SUCCESS' ? 'Welcome to Seller Dashboard!' : 'Application Under Review'}
        </h2>
        <p className="text-muted-foreground max-w-md text-lg">
          {status === 'SUCCESS'
            ? 'Your seller account is active on our systems.'
            : 'Your seller application has been submitted successfully and is currently under review by our team. We will notify you once it is approved.'}
        </p>

        {status === 'SUCCESS' && (
          <div className="pt-4 flex flex-col items-center gap-3">
            {!hasSellerRole ? (
              <>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Before proceeding to the dashboard, you need to refresh your security session.
                </p>
                <Button
                  size="lg"
                  className="rounded-full px-8 shadow-md"
                  onClick={() => signIn('keycloak', { callbackUrl: APP_ROUTES.SELLER.DASHBOARD })}
                >
                  Refresh Session & Enter Dashboard
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                className="rounded-full px-8 shadow-md"
                onClick={() => router.push(APP_ROUTES.SELLER.DASHBOARD)}
              >
                Enter Dashboard
              </Button>
            )}
          </div>
        )}

        {status === 'PENDING' && (
          <div className="pt-4">
            <Button asChild size="lg" className="rounded-full px-8 shadow-md">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

import Link from 'next/link';
import { Button } from '@/shared/ui/atoms/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="bg-destructive/10 mb-6 rounded-full p-6">
        <ShieldAlert className="text-destructive h-12 w-12" />
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Access Denied</h1>
      <p className="text-muted-foreground mb-8 max-w-md text-center">
        You do not have permission to access this page. Please contact your administrator if you
        believe this is a mistake.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Switch Account</Link>
        </Button>
      </div>
    </div>
  );
}

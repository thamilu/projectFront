import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="rounded-full bg-destructive/10 p-6 mb-6">
        <ShieldAlert className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3">Access Denied</h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        You do not have permission to access this page. 
        Please contact your administrator if you believe this is a mistake.
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

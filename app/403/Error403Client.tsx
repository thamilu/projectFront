"use client";

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';

export default function Error403Client() {
  return (
    <CardFooter className="flex flex-col gap-2 sm:flex-row">
      <Button asChild className="w-full">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Go Home
        </Link>
      </Button>

      <Button asChild variant="outline" className="w-full">
        <button type="button" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </button>
      </Button>
    </CardFooter>
  );
}

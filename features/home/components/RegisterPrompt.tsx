"use client";

import type { ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

export default function RegisterPrompt(): ReactElement {
  const router = useRouter();

  const handleRegister = () => {
    router.push(APP_ROUTES.AUTH_REGISTER);
  };

  return (
    <Button
      variant="link"
      onClick={handleRegister}
      className={
        'min-h-[44px] px-4 py-2 text-primary-foreground/90 hover:text-primary-foreground ' +
        'underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none'
      }
    >
      <span>New user? Register</span>
    </Button>
  );
}

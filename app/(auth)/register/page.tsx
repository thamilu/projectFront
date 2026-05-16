// src/app/register/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main registration page
    router.replace('/auth/register');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <p>Redirecting to registration...</p>
    </div>
  );
}

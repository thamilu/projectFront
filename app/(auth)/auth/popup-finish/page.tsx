"use client";
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PopupFinish() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const redirectTo = params?.get('redirectTo') || '/';
    // Notify opener (if present)
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'auth:success', redirectTo }, window.location.origin);
      }
    } catch (_e) {
      // ignore
    }

    // Close popup after short delay (give message time)
    setTimeout(() => {
      try {
        window.close();
      } catch (__e) {
        // Fallback: navigate to redirect target in the popup
        router.push(redirectTo);
      }
    }, 300);
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium">Completing sign-in…</p>
        <p className="mt-2 text-sm text-muted-foreground">You can close this window if it doesn't close automatically.</p>
      </div>
    </div>
  );
}

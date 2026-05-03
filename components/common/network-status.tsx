/**
 * Network Status Component
 * 
 * Displays online/offline status indicator.
 * Automatically detects connectivity changes.
 * 
 * @module components/common/network-status
 */

'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { announce } from './screen-reader-announcer';

/**
 * Network Status Indicator
 * 
 * Shows banner when user goes offline or comes back online.
 * Automatically hides after 3 seconds when online.
 * 
 * @example
 * ```tsx
 * <NetworkStatus />
 * ```
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      announce('You are back online', 'polite');

      // Hide banner after 3 seconds when back online
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      announce('You are offline. Some features may not work.', 'assertive');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2',
        'text-sm font-medium shadow-lg transition-all duration-300',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-yellow-900'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          You&apos;re offline
        </>
      )}
    </div>
  );
}

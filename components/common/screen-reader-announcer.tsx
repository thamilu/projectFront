/**
 * Screen Reader Announcer
 * 
 * Provides live region announcements for screen readers (WCAG 4.1.3).
 * Supports polite and assertive announcements.
 * 
 * @module components/common/screen-reader-announcer
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
}

// Global announcement callback
let announceCallback: ((message: string, priority?: 'polite' | 'assertive') => void) | null =
  null;

/**
 * Announce message to screen readers
 * 
 * @param message - Message to announce
 * @param priority - 'polite' (default) or 'assertive' for urgent messages
 * 
 * @example
 * ```tsx
 * import { announce } from '@/components/common/screen-reader-announcer';
 * 
 * // Polite announcement
 * announce('Item added to cart');
 * 
 * // Urgent announcement
 * announce('Error: Payment failed', 'assertive');
 * ```
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  announceCallback?.(message, priority);
}

/**
 * Screen Reader Announcer Component
 * 
 * Renders live regions for screen reader announcements.
 * Messages are automatically cleared after 1 second.
 * 
 * @example
 * ```tsx
 * // In root layout
 * <ScreenReaderAnnouncer />
 * ```
 */
export function ScreenReaderAnnouncer() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const addAnnouncement = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const id = crypto.randomUUID();
      setAnnouncements((prev) => [...prev, { id, message, priority }]);

      // Remove after screen reader has time to read it
      setTimeout(() => {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }, 1000);
    },
    []
  );

  useEffect(() => {
    announceCallback = addAnnouncement;
    return () => {
      announceCallback = null;
    };
  }, [addAnnouncement]);

  return (
    <>
      {/* Polite announcements - don't interrupt */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter((a) => a.priority === 'polite')
          .map((a) => (
            <span key={a.id}>{a.message}</span>
          ))}
      </div>

      {/* Assertive announcements - interrupt immediately */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter((a) => a.priority === 'assertive')
          .map((a) => (
            <span key={a.id}>{a.message}</span>
          ))}
      </div>
    </>
  );
}

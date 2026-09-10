import { useState, useEffect, useRef, useTransition, useCallback, RefObject } from 'react';
import { toast } from 'sonner';
import { trackEvent } from '@/core/providers/analytics-provider';
import { logger } from '@/shared/utils/logger';
import { getErrorMessage } from '@/shared/utils/get-error-message';

export interface UseSellerHeaderSearchReturn {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isPending: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  shortcutKey: string;
  handleSearchSubmit: (e?: React.FormEvent | string) => void;
  handleMobileSearchChange: (value: string) => void;
}

/**
 * Custom hook encapsulating desktop/mobile search state, transitions, input constraints,
 * platform shortcut hint detection, keyboard event listeners, and observability telemetry.
 */
export function useSellerHeaderSearch(onSearchComplete?: () => void): UseSellerHeaderSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [shortcutKey, setShortcutKey] = useState('');

  const debouncedSearchTelemetry = searchQuery.trim();

  // Platform detection for Mac vs Windows/Linux keys
  useEffect(() => {
    const isMac = (): boolean => {
      if (typeof window === 'undefined') return false;
      if ('userAgentData' in navigator) {
        return (navigator as Navigator & {
          userAgentData: { platform: string };
        }).userAgentData.platform === 'macOS';
      }
      return /Mac|iPhone|iPad/.test(navigator.platform);
    };

    setShortcutKey(isMac() ? '⌘K' : 'Ctrl+K');
  }, []);

  // Keyboard shortcut listener: focus search input on shortcut key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Telemetry logging for search query
  useEffect(() => {
    // debouncedSearchTelemetry is used for telemetry only — not for filtering or suggestions
    if (debouncedSearchTelemetry && debouncedSearchTelemetry.length > 2) {
      logger.debug('[SellerHeader] Live search term debounced:', { query: debouncedSearchTelemetry });
    }
  }, [debouncedSearchTelemetry]);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent | string) => {
      if (e && typeof e !== 'string') {
        e.preventDefault();
      }
      const rawQuery = typeof e === 'string' ? e : searchQuery;
      const trimmedQuery = rawQuery.trim().slice(0, 200); // enforce max length check
      if (!trimmedQuery) return;

      trackEvent('seller_search', {
        query: trimmedQuery,
        source: onSearchComplete ? 'mobile' : 'desktop',
      });

      // [NOT WIRED UP] This previously navigated to /seller/search, a route
      // that doesn't exist anywhere in the app — every seller search
      // submission 404'd. No seller-wide search results page or backend
      // endpoint exists yet, so this is an honest "coming soon" instead of
      // a broken link.
      startTransition(() => {
        try {
          toast.info('Seller search is coming soon.');
          if (onSearchComplete) {
            onSearchComplete();
          }
        } catch (err) {
          logger.error('[SellerHeader] Search navigation failed:', { error: getErrorMessage(err) });
          trackEvent('seller_search_error', {
            query: trimmedQuery,
            error: getErrorMessage(err),
          });
        }
      });
    },
    [searchQuery, onSearchComplete]
  );

  const handleMobileSearchChange = useCallback((value: string) => {
    setSearchQuery(value.slice(0, 200)); // enforce max length check
  }, []);

  return {
    searchQuery,
    setSearchQuery: (q: string) => setSearchQuery(q.slice(0, 200)),
    isPending,
    searchInputRef,
    shortcutKey,
    handleSearchSubmit,
    handleMobileSearchChange,
  };
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/core/client';
import { logger } from '@/core/telemetry/logger';
import { trackEvent } from '@/core/providers/analytics-provider';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import type { SearchSuggestion } from '../contracts/search.types';

export type SearchSource = 'typed' | 'suggestion' | 'recent' | 'trending';

const RECENT_SEARCHES_KEY = 'eshop_recent_searches';
const MAX_RECENT_SEARCHES = 5;
const MIN_QUERY_LENGTH_FOR_SUGGESTIONS = 2;
const SUGGESTIONS_DEBOUNCE_MS = 200;
const MAX_SUGGESTIONS = 8;

interface SuggestResponse {
  suggestions?: unknown;
  products?: unknown;
}

function buildHref(query: string, category: string): string {
  const params = new URLSearchParams({ q: query });
  if (category && category !== 'all') params.set('category', category);
  return `/search?${params.toString()}`;
}

/** Defensively normalizes the BFF route's response into typed suggestions —
 * the upstream Spring Boot shape for `/products/search/suggest` isn't
 * enforced by a shared contract, so both string and object entries are
 * tolerated here rather than assumed. */
function mapSuggestResponse(data: SuggestResponse, query: string, category: string): SearchSuggestion[] {
  const results: SearchSuggestion[] = [];

  const rawProducts = Array.isArray(data.products) ? data.products : [];
  for (const p of rawProducts) {
    if (!p || typeof p !== 'object') continue;
    const product = p as Record<string, unknown>;
    const title = typeof product.name === 'string' ? product.name : typeof product.title === 'string' ? product.title : '';
    if (!title) continue;
    const id = product.id != null ? String(product.id) : title;
    const slug = typeof product.slug === 'string' ? product.slug : undefined;
    results.push({
      id: `sug-prod-${id}`,
      title,
      type: 'product',
      href: slug ? `/products/${slug}` : buildHref(title, category),
    });
  }

  const rawSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  for (const s of rawSuggestions) {
    const title = typeof s === 'string' ? s : typeof (s as Record<string, unknown>)?.text === 'string' ? (s as Record<string, unknown>).text as string : typeof (s as Record<string, unknown>)?.title === 'string' ? (s as Record<string, unknown>).title as string : '';
    if (!title || results.some((r) => r.title.toLowerCase() === title.toLowerCase())) continue;
    results.push({
      id: `sug-text-${title}`,
      title,
      type: 'product',
      href: buildHref(title, category),
    });
  }

  return results.slice(0, MAX_SUGGESTIONS);
}

const MAX_TRENDING_SEARCHES = 6;

/** Normalizes whichever paginated/unpaginated envelope the backend returns
 * for a product list, matching the defensive unwrapping used elsewhere in
 * this codebase (see toPageResponse in shared/utils/api-helpers.ts). */
function extractProductList(resp: unknown): unknown[] {
  const r = resp as Record<string, unknown> | undefined;
  const content = (r?.data as Record<string, unknown> | undefined)?.content ?? r?.content ?? r?.data ?? r;
  return Array.isArray(content) ? content : [];
}

export function useGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  // "Trending Now" is sourced from real top-selling products rather than a
  // hardcoded list — fetched once per mount since it changes infrequently.
  // No dedicated trending-searches endpoint exists on the backend; if that
  // ever ships, this is the one place to repoint.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<unknown>(API_ENDPOINTS.PRODUCTS.TOP_SELLING, {
        params: { page: 0, size: MAX_TRENDING_SEARCHES },
      })
      .then(({ data: resp }) => {
        if (cancelled) return;
        const items = extractProductList(resp)
          .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && typeof (p as Record<string, unknown>).name === 'string')
          .map((p) => ({
            id: `trend-${p.id ?? p.name}`,
            title: p.name as string,
            type: 'trending' as const,
            href: buildHref(p.name as string, 'all'),
          }));
        setTrendingSearches(items);
      })
      .catch((error) => {
        logger.error('Failed to load trending searches', { error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, MAX_RECENT_SEARCHES));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const removeRecentSearch = useCallback((termToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  // Global Keyboard shortcut: Ctrl+K or safe '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        'tagName' in target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          (typeof target.getAttribute === 'function' &&
            Boolean(target.getAttribute('contenteditable'))));

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced live suggestions, fetched from the real BFF route
  // (app/api/search/suggest) which itself proxies the Spring Boot backend —
  // not a client-side mock. Same-origin `fetch`, matching the convention
  // used for other first-party API routes (see createPaymentIntent in
  // features/checkout/api/payment-api.ts).
  useEffect(() => {
    const trimmed = query.trim();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (trimmed.length < MIN_QUERY_LENGTH_FOR_SUGGESTIONS) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: trimmed, size: String(MAX_SUGGESTIONS) });
      fetch(`/api/search/suggest?${params.toString()}`, { signal: abortController.signal })
        .then((res) => (res.ok ? (res.json() as Promise<SuggestResponse>) : Promise.reject(new Error(`Suggest request failed (${res.status})`))))
        .then((data) => {
          setSuggestions(mapSuggestResponse(data, trimmed, category));
          setIsLoading(false);
          setActiveIndex(-1);
        })
        .catch((error) => {
          if (error?.name === 'AbortError') return;
          logger.error('Search suggestions request failed', { error, query: trimmed });
          setSuggestions([]);
          setIsLoading(false);
        });
    }, SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query, category]);

  const executeSearch = useCallback(
    (term: string, cat: string = category, source: SearchSource = 'typed') => {
      const trimmed = term.trim();
      if (!trimmed) return;
      saveRecentSearch(trimmed);
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      trackEvent('search_submitted', { query: trimmed, category: cat, source });
      const params = new URLSearchParams({ q: trimmed });
      if (cat && cat !== 'all') {
        params.set('category', cat);
      }
      router.push(`/search?${params.toString()}`);
    },
    [category, router, saveRecentSearch]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        executeSearch(suggestions[activeIndex].title, category, 'suggestion');
      } else {
        executeSearch(query, category, 'typed');
      }
    },
    [activeIndex, suggestions, query, category, executeSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
      }
    },
    [suggestions.length]
  );

  return {
    query,
    setQuery,
    category,
    setCategory,
    isOpen,
    setIsOpen,
    isLoading,
    suggestions,
    recentSearches,
    trendingSearches,
    activeIndex,
    inputRef,
    containerRef,
    handleSubmit,
    handleKeyDown,
    executeSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}

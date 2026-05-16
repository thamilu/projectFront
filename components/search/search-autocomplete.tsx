/**
 * Advanced Search Component with Autocomplete
 *
 * Features:
 * - Real-time search suggestions
 * - Keyboard navigation
 * - Recent searches
 * - Search history
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { debounce } from '@/lib/utils/debounce';
import { apiClient } from '@/lib/http/services';
import { logger } from '@/lib/observability/logger';

interface SearchSuggestion {
  text: string;
  score: number;
}

interface ProductPreview {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: { name: string };
}

interface SearchAutocompleteProps {
  onSelect?: (query: string) => void;
}

export function SearchAutocomplete({ onSelect }: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        logger.error('Failed to load recent searches', { error });
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(0, 10);

      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(
    debounce(async (...args: unknown[]) => {
      const searchQuery = String(args[0] ?? '');
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setProducts([]);
        return;
      }

      setIsLoading(true);

      try {
        const { data } = await apiClient.get<any>(
          `/api/search/suggest?q=${encodeURIComponent(searchQuery)}`
        );
        setSuggestions(data?.suggestions || []);
        setProducts(data?.products || []);

        logger.info('Suggestions fetched', {
          query: searchQuery,
          count: (data.suggestions || []).length,
        });
      } catch (error) {
        console.error('Failed to fetch suggestions', error);
        setSuggestions([]);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query) {
      fetchSuggestions(query);
    } else {
      setSuggestions([]);
      setProducts([]);
    }
  }, [query, fetchSuggestions]);

  // Handle search selection
  const handleSelect = useCallback(
    (value: string) => {
      setQuery(value);
      setIsOpen(false);
      saveRecentSearch(value);

      if (onSelect) {
        onSelect(value);
      } else {
        router.push(`/products?search=${encodeURIComponent(value)}`);
      }
    },
    [router, saveRecentSearch, onSelect]
  );

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Remove single recent search
  const removeRecentSearch = useCallback((searchQuery: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== searchQuery);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Keyboard shortcut to open search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Search trigger button */}
      <div
        className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2"
        onClick={() => setIsOpen(true)}
      >
        <Search className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground text-sm">Search products...</span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Search dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0">
          <Command className="rounded-lg border-none">
            <CommandInput
              ref={inputRef}
              placeholder="Search products..."
              value={query}
              onValueChange={setQuery}
              autoFocus
            />
            <CommandList className="max-h-100">
              {!query && recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((search) => (
                    <CommandItem
                      key={search}
                      onSelect={() => handleSelect(search)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span>{search}</span>
                      </div>
                      <X
                        className="text-muted-foreground hover:text-foreground h-3 w-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(search);
                        }}
                      />
                    </CommandItem>
                  ))}
                  {recentSearches.length > 0 && (
                    <div className="px-2 py-1">
                      <button
                        onClick={clearRecentSearches}
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </CommandGroup>
              )}

              {query && suggestions.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.text}
                      onSelect={() => handleSelect(suggestion.text)}
                    >
                      <TrendingUp className="text-muted-foreground mr-2 h-4 w-4" />
                      {suggestion.text}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {query && products.length > 0 && (
                <CommandGroup heading="Products">
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => router.push(`/products/${product.id}`)}
                      className="flex items-center gap-3 py-3"
                    >
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-muted-foreground text-xs">{product.category.name}</p>
                      </div>
                      <Badge variant="secondary">${product.price.toFixed(2)}</Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {query && !isLoading && suggestions.length === 0 && products.length === 0 && (
                <CommandEmpty>No results found for "{query}"</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

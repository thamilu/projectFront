"use client";

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type SearchFilter = 'all' | 'shop' | 'category' | 'area';

function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    setIsPending(true);
    const params = new URLSearchParams({ q: trimmed, filter: searchFilter });
    void router.push(`/search?${params.toString()}`);
  }, [isPending, router, searchFilter, searchQuery]);

  return (
    <form onSubmit={handleSubmit} role="search" aria-label="Product search" className="flex gap-0 bg-background rounded-lg shadow-md hover:shadow-lg transition-shadow w-full items-center border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="relative flex-shrink-0">
        <label htmlFor="search-filter" className="sr-only">Search filter</label>
        <select
          id="search-filter"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value as SearchFilter)}
          className="h-11 w-20 sm:w-28 pl-2 sm:pl-3 pr-7 text-xs sm:text-sm font-medium text-foreground bg-muted border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
        >
          <option value="all">All</option>
          <option value="shop">{/* shorter label on small screens */}Shop Name</option>
          <option value="category">Category</option>
          <option value="area">Area/Location</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
      </div>

      <div className="flex-1 flex items-center">
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">Search products</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            id="search-input"
            ref={inputRef}
            type="search"
            placeholder={
              searchFilter === 'shop' ? 'Search by shop name...' :
              searchFilter === 'category' ? 'Search by category...' :
              searchFilter === 'area' ? 'Search by area...' :
              'Search for products, brands, and more...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-10 h-11 border-0 focus-visible:ring-0 text-sm placeholder:text-muted-foreground/60"
            maxLength={200}
            enterKeyHint="search"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => inputRef.current && (setSearchQuery(''), inputRef.current.focus())}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex-shrink-0 px-2">
          <Button 
            type="submit" 
            size="sm" 
            className="h-10 px-4 sm:px-6 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-md hover:shadow-lg transition-all hover:scale-105" 
            disabled={isPending}
          >
            <Search className="h-4 w-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">{isPending ? 'Searching...' : 'Search'}</span>
          </Button>
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {searchFilter !== 'all' ? `Searching in ${searchFilter}` : 'Searching in all'}
      </div>
    </form>
  );
}

export default SearchBar;

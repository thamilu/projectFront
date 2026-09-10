'use client';

import React from 'react';
import { History, TrendingUp, Search, X } from 'lucide-react';
import type { SearchSuggestion } from '@/domains/search/contracts/search.types';
import type { SearchSource } from '@/domains/search/hooks/use-global-search';
import { cn } from '@/shared/utils';

interface SearchSuggestionsPopoverProps {
  isOpen: boolean;
  query: string;
  isLoading: boolean;
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  trendingSearches: SearchSuggestion[];
  activeIndex: number;
  onSelectSuggestion: (term: string, source: SearchSource) => void;
  onClearRecent: () => void;
  onRemoveRecent: (term: string) => void;
}

export const SearchSuggestionsPopover = React.memo(function SearchSuggestionsPopover({
  isOpen,
  query,
  isLoading,
  suggestions,
  recentSearches,
  trendingSearches,
  activeIndex,
  onSelectSuggestion,
  onClearRecent,
  onRemoveRecent,
}: SearchSuggestionsPopoverProps) {
  if (!isOpen) return null;

  const hasRecent = recentSearches.length > 0;
  const isQueryEmpty = !query.trim();

  return (
    <div
      id="header-search-suggestions"
      role="listbox"
      aria-label="Search suggestions"
      className="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md"
    >
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
          Searching suggestions...
        </div>
      )}

      {/* When query is typed: suggestions list */}
      {!isQueryEmpty && !isLoading && (
        <div className="space-y-1">
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <button
                key={item.id}
                role="option"
                aria-selected={activeIndex === index}
                onClick={() => onSelectSuggestion(item.title, 'suggestion')}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  activeIndex === index
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted/70'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>{item.title}</span>
                </span>
                {item.type === 'category' && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Category
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Press <span className="font-semibold text-foreground">Enter</span> to search for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* When query is empty: Recent & Trending */}
      {isQueryEmpty && (
        <div className="space-y-4">
          {/* Recent Searches */}
          {hasRecent && (
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <History className="h-3.5 w-3.5" />
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={onClearRecent}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-foreground hover:bg-muted/70"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSuggestion(term, 'recent')}
                      className="flex flex-1 items-center gap-2.5 text-left"
                    >
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{term}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecent(term);
                      }}
                      aria-label={`Remove ${term} from history`}
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches — sourced from real top-selling products
              (see useGlobalSearch); hidden entirely rather than shown empty
              if that fetch hasn't resolved yet or came back with nothing. */}
          {trendingSearches.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                Trending Now
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trendingSearches.map((trend) => (
                  <button
                    key={trend.id}
                    type="button"
                    onClick={() => onSelectSuggestion(trend.title, 'trending')}
                    className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  >
                    {trend.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasRecent && trendingSearches.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Start typing to search products, brands, or categories.
            </p>
          )}
        </div>
      )}
    </div>
  );
});

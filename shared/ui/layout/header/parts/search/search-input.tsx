'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { SEARCH_CATEGORY_OPTIONS } from '@/domains/navigation/config/header-navigation.config';

interface SearchInputProps {
  query: string;
  setQuery: (q: string) => void;
  category: string;
  setCategory: (c: string) => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchInput = React.memo(function SearchInput({
  query,
  setQuery,
  category,
  setCategory,
  isOpen,
  setIsOpen,
  inputRef,
  onSubmit,
  onKeyDown,
}: SearchInputProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Product search"
      className="relative flex w-full items-center overflow-hidden rounded-lg border border-border/80 bg-background shadow-xs transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 hover:border-border"
    >
      {/*
        Category filter — hidden below `sm`.

        It is `flex-shrink-0` and ~150px wide ("All Categories"), which at 320px
        left the form 15px wider than the viewport and made the whole document
        scroll sideways. Narrowing the search field instead would have left it
        unusably small.

        Dropping it on the narrowest phones is the right trade: searching all
        categories is the sensible default, and the same filter is available on
        the results page. The form's `overflow-hidden` above keeps the input's
        left corner rounded once this is gone.
      */}
      <div className="relative hidden flex-shrink-0 sm:block">
        <label htmlFor="header-search-category" className="sr-only">
          Select category filter
        </label>
        <select
          id="header-search-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 cursor-pointer appearance-none rounded-l-lg border-r border-border/60 bg-muted/40 pr-7 pl-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus:outline-none"
        >
          {SEARCH_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      {/* Search Input Area */}
      <div className="relative flex flex-1 items-center min-w-0">
        <Search
          className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="header-global-search-input"
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="header-search-suggestions"
          placeholder="Search products, brands, categories..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          maxLength={150}
          className="h-10 w-full rounded-r-lg border-0 bg-transparent pr-14 pl-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search query"
            className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Hotkey Badge */}
        {!query && (
          <div className="pointer-events-none absolute right-3 hidden items-center gap-0.5 rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span>{isMac ? '⌘' : 'Ctrl'}</span>
            <span>K</span>
          </div>
        )}
      </div>
    </form>
  );
});

'use client';

import React from 'react';
import { useGlobalSearch } from '@/domains/search/hooks/use-global-search';
import { SearchInput } from './search/search-input';
import { SearchSuggestionsPopover } from './search/search-suggestions-popover';

interface HeaderSearchProps {
  isDashboard?: boolean;
}

export const HeaderSearch = React.memo(function HeaderSearch({ isDashboard }: HeaderSearchProps) {
  const {
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
  } = useGlobalSearch();

  if (isDashboard) {
    return <div className="hidden md:col-start-2 md:row-start-1 md:block" />;
  }

  return (
    <div
      /*
       * Grid placement, set explicitly at each breakpoint — see the header row
       * in shared/ui/layout/header.tsx for the full layout and why this is not
       * `flex-wrap`.
       *
       *   mobile: row 2, spanning both columns (full width beneath the brand)
       *   md+:    row 1, column 2 (between the brand and the actions)
       *
       * `min-w-0` is what lets it actually shrink. A grid/flex item defaults to
       * `min-width: auto` and refuses to go below its content's intrinsic
       * width, which is the most common cause of a row overflowing its
       * container and contributed to the original overflow here.
       */
      className="col-span-2 row-start-2 flex min-w-0 justify-center md:col-span-1 md:col-start-2 md:row-start-1 md:px-2 lg:px-6"
      ref={containerRef}
    >
      <div className="relative w-full max-w-xl">
        <SearchInput
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          inputRef={inputRef}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
        />
        <SearchSuggestionsPopover
          isOpen={isOpen}
          query={query}
          isLoading={isLoading}
          suggestions={suggestions}
          recentSearches={recentSearches}
          trendingSearches={trendingSearches}
          activeIndex={activeIndex}
          onSelectSuggestion={(term, source) => executeSearch(term, category, source)}
          onClearRecent={clearRecentSearches}
          onRemoveRecent={removeRecentSearch}
        />
      </div>
    </div>
  );
});

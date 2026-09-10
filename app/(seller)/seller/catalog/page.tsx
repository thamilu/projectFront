'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMasterProducts } from '@/features/seller/hooks/use-seller';
import { productsApi } from '@/domains/catalog/infrastructure/api/catalog-api';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/ui/atoms/card';
import { APP_ROUTES } from '@/shared/routes';
import type { MasterProductDTO } from '@/domains/catalog/contracts/catalog.types';
import {
  Search,
  ShoppingBag,
  Layers,
  Cpu,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  Package,
  Plus,
  AlertTriangle,
  TrendingUp,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import Image from 'next/image';

export default function MasterCatalogPage() {
  const router = useRouter();
  const qc = useQueryClient();

  // Search and Pagination States
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  /**
   * Index of the keyboard-highlighted suggestion, or -1 for none.
   *
   * A combobox needs this separately from DOM focus: focus must stay in the
   * input so typing continues to work, while `aria-activedescendant` tells a
   * screen reader which option is current. Moving real focus into the list
   * instead is the common mistake — it breaks typing and the Backspace key.
   */
  const [activeIndex, setActiveIndex] = useState(-1);

  // Modal & Selection States
  const [cloningId, setCloningId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MasterProductDTO | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Dropdown suggestions ref
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search input handler (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 on new search query
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  /**
   * Dismiss the suggestion list on an outside pointer press.
   *
   * Paired with the Escape handling on the input below. Previously this was the
   * *only* way to close the list, so it was unreachable by keyboard — while the
   * list's own header told the user "Press ESC to close", an affordance that
   * did not exist.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // API query parameters
  const params = useMemo(
    () => ({
      page: page - 1,
      size,
      search: debouncedQuery.trim() || undefined,
    }),
    [page, size, debouncedQuery]
  );

  // Fetch master products from global catalog backend
  const { data, isLoading, isError, error } = useMasterProducts(params);
  const products = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  // Filtered/matching items for autocomplete dropdown (showing matches from current search response)
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim() || products.length === 0) return [];
    return products.slice(0, 5);
  }, [products, searchQuery]);

  /**
   * Clear the highlight when the suggestions change.
   *
   * Without this, an index left over from the previous result set points at a
   * different product — so Enter would commit something the user never saw
   * highlighted.
   */
  useEffect(() => {
    setActiveIndex(-1);
  }, [autocompleteSuggestions]);

  /** Commit a suggestion: fill the input, run the search, close the list. */
  const applySuggestion = useCallback((name: string) => {
    setSearchQuery(name);
    setDebouncedQuery(name);
    setShowSuggestions(false);
    setActiveIndex(-1);
  }, []);

  /**
   * Keyboard model for the combobox, per the WAI-ARIA Authoring Practices.
   *
   * - Arrow Down / Up move the highlight, wrapping at both ends so the list is
   *   fully reachable without knowing its length.
   * - Home / End jump to the first and last option.
   * - Enter commits the highlighted option; with none highlighted it falls
   *   through to a plain search, which is what a user who ignored the list expects.
   * - Escape closes the list — the behaviour the header has always advertised.
   * - Tab closes it too, so the list cannot obscure the next control.
   */
  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const isOpen = showSuggestions && autocompleteSuggestions.length > 0;

      switch (event.key) {
        case 'ArrowDown':
          if (!isOpen) {
            setShowSuggestions(true);
            return;
          }
          event.preventDefault();
          setActiveIndex((current) => (current + 1) % autocompleteSuggestions.length);
          break;

        case 'ArrowUp':
          if (!isOpen) return;
          event.preventDefault();
          setActiveIndex((current) =>
            current <= 0 ? autocompleteSuggestions.length - 1 : current - 1
          );
          break;

        case 'Home':
          if (!isOpen) return;
          event.preventDefault();
          setActiveIndex(0);
          break;

        case 'End':
          if (!isOpen) return;
          event.preventDefault();
          setActiveIndex(autocompleteSuggestions.length - 1);
          break;

        case 'Enter':
          if (isOpen && activeIndex >= 0) {
            event.preventDefault();
            applySuggestion(autocompleteSuggestions[activeIndex].name);
          }
          break;

        case 'Escape':
          if (!isOpen) return;
          event.preventDefault();
          setShowSuggestions(false);
          setActiveIndex(-1);
          break;

        case 'Tab':
          setShowSuggestions(false);
          setActiveIndex(-1);
          break;

        default:
          break;
      }
    },
    [showSuggestions, autocompleteSuggestions, activeIndex, applySuggestion]
  );

  // Clone to storefront mutation
  const cloneMutation = useMutation({
    mutationFn: (masterProductId: number) => productsApi.cloneToStore(masterProductId),
    onSuccess: (newProduct) => {
      toast.success('Successfully listed in your store!', {
        description: `Linked to master catalog. Redirecting to edit details...`,
      });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['seller', 'products'] });
      router.push(APP_ROUTES.SELLER.EDIT_PRODUCT(String(newProduct.id)));
    },
    onError: (err: any) => {
      toast.error('Failed to list product', {
        description: err?.message || 'Please check store settings and try again.',
      });
      setCloningId(null);
    },
  });

  const handleSellProduct = (p: MasterProductDTO) => {
    setSelectedProduct(p);
    setShowOptionsModal(true);
  };

  const handleTriggerClone = () => {
    if (!selectedProduct) return;
    setShowOptionsModal(false);
    setCloningId(selectedProduct.id);
    cloneMutation.mutate(selectedProduct.id);
  };

  /*
   * [REMOVED] `getProductMetrics(productId)` used to live here.
   *
   * It derived a rating, a "sellers active" count and a "from" price from
   * arithmetic on the row's own id — `(productId * 7) % 28 + 1` sellers,
   * `199 + ((productId * 17) % 100) * 8.5` for the price — and the card
   * rendered all three as though they were market data. A companion flag,
   * `hasPremiumTrust = p.id % 3 === 0`, stamped a "Top Selling" badge on every
   * third product for the same reason: none.
   *
   * This is the page a seller uses to decide what to stock. Invented
   * competitive intelligence ("23 Sellers Active · From $847") is not a
   * cosmetic placeholder here — it is the input to a real commercial decision,
   * and it was also printing `$` in an application configured for INR.
   *
   * `MasterProductDTO` (domains/catalog/contracts/catalog.types.ts) carries no
   * price, rating or seller-count field, so there was nothing real to show and
   * nothing to swap in. The card now renders only what the catalog actually
   * knows. Restoring these figures requires the backend to expose them; it is
   * a contract change, not a formatting one.
   */

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 sm:p-6 md:p-8 dark:bg-zinc-950/20">
      {/* Immersive Header Banner */}
      <header className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
                <Sparkles className="h-3 w-3 animate-pulse text-amber-300" /> Shared Catalog
                Governance
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Master Catalog Marketplace
            </h1>
            <p className="mt-2 text-sm leading-relaxed font-medium text-blue-100 sm:text-base">
              Search the pre-approved global database. Adding a catalog product pools SEO traffic,
              matches customers instantly, inherits professional HD media, and bypasses duplicate
              listing moderation!
            </p>
          </div>

          <div className="flex shrink-0 items-center">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-inner backdrop-blur-md">
              <div className="text-center">
                <div className="text-3xl font-black text-white">{totalElements}</div>
                <div className="mt-0.5 text-[10px] font-bold tracking-wider text-blue-200 uppercase">
                  Pre-Approved Items
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Governance Trust Info Box */}
      <section className="mb-6 flex gap-3.5 rounded-2xl border border-blue-100/60 bg-blue-50/30 p-4 text-blue-800 backdrop-blur-sm dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-300">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-xs leading-relaxed sm:text-sm">
          <h2 className="font-bold text-blue-900 dark:text-blue-200">Catalog Governance Policy:</h2>
          <p className="mt-1 font-medium">
            Standard products share details globally. To list a product, click{' '}
            <strong className="text-blue-700 dark:text-blue-400">"Sell This"</strong> to link it to
            your shop inventory. You override price and stock count for your storefront. Derived
            models can be created via{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">"Customize"</strong> if you
            offer distinct manufacturer bundling or rebranding.
          </p>
        </div>
      </section>

      {/* Controls / Search Bar Container */}
      <section className="mb-6 flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div ref={searchContainerRef} className="relative w-full sm:max-w-2xl">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            {/*
              A real WAI-ARIA combobox. Previously this was a bare text input
              beside a div of buttons: no role, no `aria-expanded`, no way to
              reach the suggestions with a keyboard, and no Escape handler
              despite the list header instructing users to press it.

              `aria-activedescendant` points at the highlighted option while
              DOM focus stays in the input — that is what lets a screen-reader
              user hear each suggestion as they arrow through it without losing
              the ability to keep typing.
            */}
            <input
              type="text"
              role="combobox"
              placeholder="Search master catalog by name, model, brand, or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pr-10 pl-11 text-sm font-medium transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              aria-label="Search catalog items"
              id="catalog-search-input"
              aria-expanded={showSuggestions && autocompleteSuggestions.length > 0}
              aria-controls="catalog-search-listbox"
              aria-autocomplete="list"
              // Browsers must not layer their own autofill list over ours.
              autoComplete="off"
              aria-activedescendant={
                activeIndex >= 0 ? `catalog-suggestion-${activeIndex}` : undefined
              }
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                }}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                aria-label="Clear search query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/*
            Result count, announced politely. Without a live region the
            suggestion list appearing, changing or emptying is silent to a
            screen-reader user — they have no signal that arrowing down would
            now do anything.
          */}
          <span className="sr-only" role="status" aria-live="polite">
            {showSuggestions && autocompleteSuggestions.length > 0
              ? `${autocompleteSuggestions.length} suggestion${autocompleteSuggestions.length === 1 ? '' : 's'} available. Use arrow keys to browse.`
              : ''}
          </span>

          {/* Autocomplete suggestions dropdown (Basic Live Suggestions) */}
          {showSuggestions && autocompleteSuggestions.length > 0 && (
            <div className="animate-fadeIn absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-muted-foreground flex items-center justify-between border-b bg-slate-50/50 p-2 px-3 text-[11px] font-semibold dark:border-zinc-800 dark:bg-zinc-950/50">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" /> Live Suggestions
                </span>
                <span>Press ESC to close</span>
              </div>
              <ul
                id="catalog-search-listbox"
                role="listbox"
                aria-label="Catalog suggestions"
                className="max-h-80 overflow-y-auto py-1"
              >
                {autocompleteSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    id={`catalog-suggestion-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    // The option itself is the interactive element, as the
                    // listbox pattern requires — a <button> inside an option
                    // creates a nested interactive control that screen readers
                    // announce inconsistently. Pointer handling stays on the
                    // list item; keyboard handling lives on the input.
                    onClick={() => applySuggestion(suggestion.name)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      index === activeIndex ? 'bg-slate-100 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <>
                      {suggestion.imageUrl ? (
                        <Image
                          src={suggestion.imageUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 shrink-0 rounded-md border bg-slate-100 object-cover dark:bg-zinc-950"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-slate-100 dark:bg-zinc-950">
                          <Package className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-200">
                          {suggestion.name}
                        </p>
                        <p className="text-muted-foreground truncate text-[10px] font-medium">
                          {suggestion.brandName ? `${suggestion.brandName} • ` : ''}
                          {suggestion.categoryName}
                        </p>
                      </div>
                      <ArrowRight
                        className="h-3 w-3 shrink-0 text-slate-300 dark:text-zinc-600"
                        aria-hidden="true"
                      />
                    </>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action summary & guided status */}
        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 sm:text-sm dark:text-zinc-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
            {isLoading ? 'Scanning catalog...' : `Found ${totalElements} pre-approved items`}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`${APP_ROUTES.SELLER.PRODUCTS}/create`)}
            className="dark:hover:bg-zinc-800 inline-flex h-auto cursor-pointer items-center gap-1.5 self-start rounded-xl border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 sm:self-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <Plus className="h-4 w-4" /> Create Custom Master Product
          </Button>
        </div>
      </section>

      {/* Loading Skeleton Grid */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="aspect-video w-full bg-slate-200 dark:bg-zinc-950" />
              <CardContent className="space-y-3 p-5">
                <div className="dark:bg-zinc-800 h-4 w-1/3 rounded bg-slate-200" />
                <div className="dark:bg-zinc-800 h-5 w-5/6 rounded bg-slate-200" />
                <div className="dark:bg-zinc-800 h-4 w-full rounded bg-slate-200" />
                <div className="dark:bg-zinc-800 h-3 w-2/3 rounded bg-slate-200" />
              </CardContent>
              <CardFooter className="h-14 bg-slate-50 p-4 dark:bg-zinc-900/50" />
            </Card>
          ))}
        </div>
      )}

      {/* Error View */}
      {isError && (
        <Card className="mx-auto max-w-xl rounded-2xl border-red-200 bg-red-50/50 p-6 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Catalog Load Failure
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {(error as any)?.message ||
              'Something went wrong while connecting to the global product catalog. Please retry.'}
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              onClick={() => qc.invalidateQueries({ queryKey: ['seller', 'master-products'] })}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Retry Connection
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Rich Guided Empty State (Phase 1 Requirement) */}
      {!isLoading && !isError && products.length === 0 && (
        <section className="animate-fadeIn mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white p-10 text-center shadow-sm sm:p-16 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border bg-slate-100 dark:bg-zinc-950">
            <Layers className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100">
            {searchQuery ? `No Catalog Matching "${searchQuery}"` : 'Marketplace Catalog Empty'}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed font-medium">
            {searchQuery
              ? `We couldn't find any pre-approved catalog templates matching your query. Follow marketplace governance protocols below.`
              : 'The global product catalog does not contain any approved products yet.'}
          </p>

          {/* Guided Action Steps */}
          <div className="dark:border-zinc-800 my-6 w-full max-w-sm space-y-3 rounded-xl border bg-slate-50 p-4 text-left text-xs dark:bg-zinc-950/60">
            <span className="mb-1 block font-bold text-slate-700 dark:text-zinc-300">
              Guided Search & Recovery Flow:
            </span>
            <div className="flex gap-2.5">
              <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                1
              </span>
              <p className="font-medium text-slate-600 dark:text-zinc-400">
                Verify spelling or search broader categories (e.g. "iPhone" rather than specific
                colors).
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                2
              </span>
              <p className="font-medium text-slate-600 dark:text-zinc-400">
                Look up dynamic brand indexes by applying general tags.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                3
              </span>
              <p className="font-medium text-slate-600 dark:text-zinc-400">
                If unique, click below to launch the **New Product Wizard** to submit a new master
                catalog item.
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-sm flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              variant="outline"
              className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 text-xs font-bold sm:w-auto"
            >
              Clear Search Query
            </Button>
            <Button
              onClick={() => router.push(`${APP_ROUTES.SELLER.PRODUCTS}/create`)}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Create Catalog Item
            </Button>
          </div>
        </section>
      )}

      {/* Grid of Catalog Products */}
      {!isLoading && !isError && products.length > 0 && (
        <>
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => {
              const isCloningThis = cloningId === p.id;

              return (
                <article
                  key={p.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200/80 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900/60"
                >
                  <div>
                    {/* Media Thumbnail Container */}
                    <div className="dark:border-zinc-800 relative aspect-video w-full overflow-hidden border-b bg-slate-100 dark:bg-zinc-950">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          // Empty alt: the product name is the adjacent <h3>,
                          // so naming the image repeats it for screen readers.
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-950 dark:to-zinc-900">
                          <ShoppingBag className="h-8 w-8 text-slate-400 dark:text-zinc-600" />
                        </div>
                      )}

                      {/* Brand Overlay Badge */}
                      {p.brandName && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-slate-800 uppercase shadow-md backdrop-blur-sm dark:bg-zinc-900/95 dark:text-zinc-100">
                          <Tag className="h-3 w-3 text-blue-500" /> {p.brandName}
                        </span>
                      )}

                    </div>

                    {/* Metadata Content */}
                    <div className="p-5">
                      {/* Category is real catalog data; the rating that sat
                          beside it was arithmetic on the product id. */}
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-extrabold tracking-wide text-slate-600 uppercase dark:bg-zinc-800/80 dark:text-zinc-300">
                          <Layers className="text-primary h-2.5 w-2.5" /> {p.categoryName}
                        </span>
                      </div>

                      <h3 className="line-clamp-1 text-sm leading-snug font-extrabold text-slate-800 transition-colors group-hover:text-blue-600 sm:text-base dark:text-zinc-100 dark:group-hover:text-blue-400">
                        {p.name}
                      </h3>
                      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs leading-relaxed font-medium">
                        {p.shortDescription ||
                          p.baseDescription ||
                          'No description available for this global catalog item.'}
                      </p>

                      {/* Specifications Summary Component */}
                      {p.specifications ? (
                        <div className="dark:border-zinc-800 mt-3.5 rounded-xl border border-slate-100/50 bg-slate-50/70 p-2.5 text-[11px] dark:bg-zinc-950/50">
                          <span className="flex items-center gap-1 text-[9px] font-bold tracking-wide text-slate-500 uppercase dark:text-zinc-400">
                            <Cpu className="h-3 w-3 text-emerald-500" /> Specifications
                          </span>
                          <span className="mt-1 line-clamp-2 block font-medium text-slate-600 dark:text-zinc-400">
                            {p.specifications}
                          </span>
                        </div>
                      ) : (
                        <div className="dark:border-zinc-800 mt-3.5 rounded-xl border border-dashed bg-slate-50/40 p-2.5 text-[11px] font-medium text-slate-500 italic dark:bg-zinc-950/20">
                          Standard specifications inherit details globally.
                        </div>
                      )}

                      {/*
                        Brand attribution — real catalog data. This replaces the
                        "N Sellers Active · From $X" row, whose figures were both
                        derived from the product id and whose price was rendered
                        with a hardcoded `$` in an INR deployment.
                      */}
                      {p.brandName && (
                        <div className="dark:border-zinc-800 mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3.5 text-xs font-bold text-slate-600 dark:text-zinc-300">
                          <Tag className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>{p.brandName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="dark:border-zinc-800 flex gap-2 border-t bg-slate-50/50 p-4 dark:bg-zinc-900/30">
                    <Button
                      onClick={() => handleSellProduct(p)}
                      disabled={cloningId !== null}
                      className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-95"
                    >
                      {isCloningThis ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Listing Product...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4" />
                          <span>Sell This</span>
                          <ArrowRight className="h-3.5 w-3.5 -translate-x-1.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                        </>
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <footer className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-zinc-800">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Page <span className="font-bold text-slate-800 dark:text-zinc-200">{page}</span> of{' '}
                <span className="font-bold text-slate-800 dark:text-zinc-200">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-9 cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-9 cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          )}
        </>
      )}

      {/* Upgraded Reuse vs Customize Selection Modal (Phase 1 Core Marketplace Decision Point) */}
      <Dialog open={showOptionsModal} onOpenChange={setShowOptionsModal}>
        <DialogContent className="dark:border-zinc-800 animate-fadeIn overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl sm:max-w-[540px] dark:bg-zinc-950">
          <DialogHeader className="dark:border-zinc-800 border-b pb-3">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-black text-slate-900 dark:text-zinc-50">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
              Select Catalog Listing Method
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1.5 text-xs leading-relaxed font-medium">
              Decide how to offer this pre-approved catalog item. Reusing the master catalog
              maximizes sales velocity and buyer trust.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="my-5 space-y-5">
              {/* Product Brief Summary Card */}
              <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="h-14 w-14 shrink-0 rounded-lg border bg-white object-cover dark:bg-zinc-950"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-slate-100 dark:bg-zinc-950">
                    <Package className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-slate-800 dark:text-zinc-100">
                    {selectedProduct.name}
                  </h4>
                  <p className="mt-0.5 text-[10px] font-extrabold tracking-wider text-indigo-500 uppercase">
                    {selectedProduct.categoryName}
                  </p>
                </div>
              </div>

              {/* Mode Options Cards */}
              <div className="grid gap-3.5">
                {/* Option 1: Sell Existing (Standard Reuse Listing) */}
                <button
                  type="button"
                  onClick={handleTriggerClone}
                  className="group flex cursor-pointer items-start rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50/15 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-blue-950/20"
                >
                  <div className="mt-0.5 mr-3.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                        Sell Standard Catalog Item
                      </h5>
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-400">
                        Recommended
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed font-medium">
                      Link your storefront instantly. Inherits all global images, category tags, and
                      verified specifications. Skipping custom moderation means your offer goes
                      active **instantly** to pool SEO and customer traffic.
                    </p>
                  </div>
                </button>

                {/* Option 2: Create Customized Version (Fork Derived Listing) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsModal(false);
                    router.push(
                      `${APP_ROUTES.SELLER.PRODUCTS}/create?parentMasterProductId=${selectedProduct.id}`
                    );
                  }}
                  className="group flex cursor-pointer items-start rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-500 hover:bg-indigo-50/15 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-indigo-950/20"
                >
                  <div className="mt-0.5 mr-3.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-slate-800 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                      Create Customized Version
                    </h5>
                    <p className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed font-medium">
                      Fork this template to customize attributes, branding, or media. Best when
                      selling bundle variations, modified appearances, or derived brand
                      configurations. Submits as a child master listing for catalog safety.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-3 border-t pt-4 dark:border-zinc-800">
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" /> Catalog Guard Active
            </span>
            <Button
              variant="ghost"
              onClick={() => setShowOptionsModal(false)}
              className="h-9 cursor-pointer rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900"
            >
              Cancel Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

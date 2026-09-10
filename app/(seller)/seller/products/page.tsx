'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/atoms/button';
import { useCategories } from '@/features/products/hooks/use-products';
import { useSellerProducts } from '@/features/seller/hooks/use-seller';
import { toast } from 'sonner';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { productApi } from '@/features/products/api/product-api';
import type { ProductDTO } from '@/shared/types';
import { APP_ROUTES } from '@/shared/routes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import {
  removeProductsFromCaches,
  restoreProductCaches,
  invalidateProductCaches,
} from '@/features/seller/utils/product-cache';
import { Store, CheckCircle2, HelpCircle, BookOpen, MessageSquare, Search } from 'lucide-react';

export default function SellerProductsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const params = useMemo(
    () => ({ page, size, query, categoryId: category }),
    [page, size, query, category]
  );

  const productsQuery = useSellerProducts(params);
  const categoriesQuery = useCategories();
  const qc = useQueryClient();

  /**
   * Whether the failure means "this seller has no store yet" rather than a
   * genuine error.
   *
   * Detected by status code. The previous check also matched on the literal
   * strings 'Store not found' and 'JIT creation failed' inside the error
   * message — which breaks the moment backend copy is reworded or localised,
   * and would then show a seller a generic error instead of the
   * create-your-store prompt they need. A 404 on the seller's own product list
   * has exactly one meaning here.
   */
  const queryError = productsQuery.error as { statusCode?: number; status?: number } | null;
  const errorStatus = queryError?.statusCode ?? queryError?.status;
  const isMissingStore = productsQuery.isError && errorStatus === 404;

  const products = productsQuery.data?.content ?? [];
  const totalPages = productsQuery.data?.totalPages ?? 1;

  /**
   * Ids selected for a bulk action.
   *
   * A Set rather than the previous `Record<number, boolean>`: membership is the
   * only question ever asked, and a record accumulates `false` entries that
   * then have to be filtered out at every read.
   */
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  /** Clear the selection whenever the visible page changes. */
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, query, category]);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const allVisibleSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      const everySelected = products.length > 0 && products.every((p) => current.has(p.id));
      // Select-all applies to the visible page only. Silently selecting rows
      // the seller cannot see, then deleting them, is not a defensible default.
      return everySelected ? new Set<number>() : new Set(products.map((p) => p.id));
    });
  }, [products]);

  /**
   * Delete one or many products.
   *
   * Single and bulk share one mutation deliberately. They were previously two
   * implementations — an optimistic `deleteMut` and an unwired `_bulkDelete`
   * that duplicated its cache logic and called a different, unversioned
   * endpoint (`/api/products/:id` instead of `productApi.delete`), so it would
   * have 404'd had anything ever invoked it.
   */
  const deleteMut = useMutation({
    mutationFn: async (ids: readonly number[]) => {
      // `allSettled`, not `all`: one rejection must not hide which of the
      // others succeeded, or the rollback below would revert deletions that
      // actually happened.
      const results = await Promise.allSettled(ids.map((id) => productApi.delete(id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { requested: ids.length, failed };
    },

    onMutate: async (ids) => ({ snapshot: await removeProductsFromCaches(qc, ids) }),

    onError: (error, _ids, context) => {
      restoreProductCaches(qc, context?.snapshot);
      toast.error('Could not delete', {
        description:
          error instanceof Error ? error.message : 'Nothing was removed. Please try again.',
      });
    },

    onSuccess: ({ requested, failed }) => {
      setSelectedIds(new Set());

      if (failed === 0) {
        toast.success(requested === 1 ? 'Product deleted' : `${requested} products deleted`);
        return;
      }

      // A partial failure is reported honestly rather than as a flat success —
      // the seller needs to know some rows are still live.
      toast.warning(`Deleted ${requested - failed} of ${requested}`, {
        description: 'Some products could not be removed. The list has been refreshed.',
      });
    },

    onSettled: () => invalidateProductCaches(qc),
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Breadcrumbs and Page Heading */}
      <div className="flex flex-col gap-1 border-b border-gray-200 dark:border-slate-800/80 pb-4">
        <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500" aria-label="Breadcrumb">
          <span>Seller Center</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-300">Products</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Products</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your catalog • Import • Sync • Organize
            </p>
          </div>
          
          {/* Header Action Shortcuts (Import/Export/Sync/Drafts) - disabled when store profile is required.
              [NOT WIRED UP] No real backend exists yet for bulk CSV import,
              catalog export, or an external catalog sync — these previously
              had no onClick at all, so clicking them (once a store existed)
              silently did nothing with no feedback. */}
          <div className="flex items-center gap-2.5 flex-wrap" aria-label="Product Page Actions">
            <Button
              variant="outline"
              disabled={isMissingStore}
              aria-disabled={isMissingStore ? "true" : undefined}
              onClick={() => toast.info('Bulk CSV import is coming soon.')}
              className="h-8 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import CSV
            </Button>
            <Button
              variant="outline"
              disabled={isMissingStore}
              aria-disabled={isMissingStore ? "true" : undefined}
              onClick={() => toast.info('Catalog export is coming soon.')}
              className="h-8 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
            </Button>
            <Button
              variant="outline"
              disabled={isMissingStore}
              aria-disabled={isMissingStore ? "true" : undefined}
              onClick={() => toast.info('Catalog sync is coming soon.')}
              className="h-8 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sync Catalog
            </Button>
            <Button
              variant="outline"
              disabled={isMissingStore}
              aria-disabled={isMissingStore ? "true" : undefined}
              onClick={() => toast.info('Draft products are coming soon.')}
              className="h-8 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Drafts
            </Button>
          </div>
        </div>
      </div>

      {/* Main product management toolbar controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50 dark:bg-slate-900/20 p-3.5 rounded-xl border border-gray-200/60 dark:border-slate-800/80">
        <div className="flex flex-wrap flex-1 items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="text-slate-500 absolute top-2.5 left-2.5 h-4 w-4" />
            <input
              aria-label="Search products"
              value={query}
              onChange={(e) => {
                if (isMissingStore) return;
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={isMissingStore ? "Search products (disabled) - Complete Store Profile first" : "Search products..."}
              disabled={isMissingStore}
              aria-disabled={isMissingStore ? "true" : undefined}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 pl-8 text-xs text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Category</span>
            <select
              value={category ?? ''}
              onChange={(e) => {
                if (isMissingStore) return;
                setCategory(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              disabled={isMissingStore}
              aria-disabled={isMissingStore ? "true" : undefined}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 text-xs px-2.5 py-1.5 rounded-lg h-9 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            >
              <option value="">{isMissingStore ? "All Categories (Disabled)" : "All categories"}</option>
              {!isMissingStore && (Array.isArray(categoriesQuery.data)
                ? categoriesQuery.data
                : ((categoriesQuery.data as any)?.categories ??
                  (categoriesQuery.data as any)?.items ??
                  [])
              ).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMissingStore ? (
            <Button
              variant="outline"
              disabled
              aria-disabled="true"
              className="border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed text-xs font-semibold h-9 rounded-xl"
            >
              🌐 Browse Shared Catalog
            </Button>
          ) : (
            <Link href="/seller/catalog" passHref>
              <Button
                variant="outline"
                className="border-blue-200 font-semibold text-blue-700 shadow-sm hover:bg-blue-50 hover:text-blue-800 text-xs h-9 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                🌐 Browse Shared Catalog
              </Button>
            </Link>
          )}

          {isMissingStore ? (
            <Button
              disabled
              aria-disabled="true"
              className="bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-655 opacity-50 cursor-not-allowed text-xs font-semibold h-9 rounded-xl"
            >
              Add Product
            </Button>
          ) : (
            <Link href={APP_ROUTES.SELLER.PRODUCTS_CREATE} passHref>
              <Button className="bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 text-xs h-9 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500">
                Add Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {productsQuery.isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      )}

      {productsQuery.isError && (
        isMissingStore ? (
          <div className="flex flex-col items-center justify-center p-4" role="region" aria-label="Seller Onboarding Flow">
            <div className="w-full max-w-5xl rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/5 dark:bg-zinc-900/20 p-6 md:p-10 space-y-8">
              
              {/* Top Intro Section */}
              <div className="flex flex-col md:flex-row items-center gap-6 border-b border-gray-100 dark:border-slate-800/80 pb-6">
                <div className="rounded-2xl bg-indigo-100 dark:bg-indigo-950 p-4 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Store className="h-12 w-12" />
                </div>
                <div className="space-y-2 text-center md:text-left flex-1">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                    Complete your seller onboarding
                    <span className="text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full select-none">
                      Step 3 of 5
                    </span>
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    You need to set up your store profile before you can list, manage, or view products in your catalog. Setting up your profile takes approximately <span className="font-semibold text-slate-800 dark:text-slate-200">4–6 minutes</span>.
                  </p>
                </div>
                
                {/* Setup Health Widget */}
                <div className="shrink-0 bg-slate-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/60 p-4 rounded-xl text-center space-y-1 w-44">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Store Profile</p>
                  <p className="text-xs font-black text-amber-500">Not Started</p>
                  <p className="text-[10px] text-slate-400">Est. Time: 4 mins</p>
                </div>
              </div>

              {/* Main Grid: Onboarding Checklist & Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                
                {/* Left: Checklist & Progress */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-wider">
                      <span>Setup Progress</span>
                      <span className="text-indigo-500 font-bold">60% Complete</span>
                    </div>
                    {/* Thicker Progress bar */}
                    <div className="relative h-4.5 w-full bg-gray-100 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-200 dark:border-slate-800 flex items-center justify-center">
                      <div className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: '60%' }} />
                      <span className="relative z-10 text-[9px] font-black text-white mix-blend-difference">60%</span>
                    </div>
                  </div>

                  {/* Onboarding Checklist */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Setup Checklist</h4>
                    <div className="space-y-2.5 bg-slate-100/40 dark:bg-slate-950/20 p-4 rounded-xl border border-gray-200 dark:border-slate-800/80">
                      <div className="flex items-center gap-2.5 text-xs text-slate-400">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="line-through">Verify Seller Identity</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="line-through">KYC Verification Audit</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 font-bold">
                        <span className="h-4 w-4 rounded-full border border-indigo-500 bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[9px] font-black shrink-0">3</span>
                        <span>Setup Store Profile (GSTIN, Business Address)</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-slate-500">
                        <span className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 flex items-center justify-center text-[9px] font-black shrink-0">4</span>
                        <span>Upload Catalog & List Products (Locked)</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-slate-500">
                        <span className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 flex items-center justify-center text-[9px] font-black shrink-0">5</span>
                        <span>Activate Storefront & Go Live (Locked)</span>
                      </div>
                    </div>
                  </div>

                  {/* Required Missing Fields */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Required Profile Info</h4>
                    <div className="grid grid-cols-2 gap-3 bg-slate-100/40 dark:bg-slate-950/20 p-4 rounded-xl border border-gray-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400 font-mono select-none">•</span> GSTIN / Tax Code
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400 font-mono select-none">•</span> Legal Business Name
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400 font-mono select-none">•</span> Pickup Address
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400 font-mono select-none">•</span> Merchant Bank Details
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Benefits & Contextual support */}
                <div className="space-y-5 flex flex-col justify-between">
                  {/* Benefits Checklist */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Why complete Store Profile?</h4>
                    <div className="space-y-2.5 bg-slate-100/40 dark:bg-slate-950/20 p-4 rounded-xl border border-gray-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">Publish products:</span> Activate item listings so they become visible to customers.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">Receive orders:</span> Enable the marketplace checkout cart for your products.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">Get verified:</span> Earn the verified seller badge to build buyer trust.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">Unlock analytics:</span> Access detailed revenue, conversion, and traffic dashboards.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Help documentation links */}
                  <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" /> Contextual Help Panel
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                      Need assistance setting up your merchant profile? Access our onboarding resources or talk to a customer support agent.
                    </p>
                    <div className="flex gap-3 pt-1">
                      <Link href="/seller/support" className="text-[10px] font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5">
                        Read Guide <BookOpen className="h-3 w-3" />
                      </Link>
                      <span className="text-slate-700">|</span>
                      <Link href="/seller/support" className="text-[10px] font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5">
                        Contact Support <MessageSquare className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3.5 border-t border-gray-200 dark:border-slate-800/80 pt-6">
                <Link href="/seller/support" passHref>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-10 px-5 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Learn More
                  </Button>
                </Link>
                <Link href={APP_ROUTES.SELLER.STORE_CREATE} passHref>
                  <Button
                    autoFocus={isMissingStore}
                    className="w-full sm:w-auto h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-blue-500/20 focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    ⚡ Setup Store Profile Now
                  </Button>
                </Link>
              </div>

            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400" role="alert">
            <p className="text-lg font-semibold">Error loading products</p>
            <p className="mt-1 text-sm">{(productsQuery.error as any)?.message || 'Please try again later.'}</p>
          </div>
        )
      )}

      {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center">
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Get started by creating your first product listing.
          </p>
          <Link href={APP_ROUTES.SELLER.PRODUCTS_CREATE}>
            <Button>Add New Product</Button>
          </Link>
        </div>
      )}

      {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          {/*
            Bulk action bar. The delete logic for this existed but was never
            rendered — `_bulkDelete` sat unreachable behind an underscore
            prefix that silenced the unused-variable lint. Bulk actions were
            also the highest-ranked missing productivity feature in the seller
            console; wiring the existing implementation delivers it.
          */}
          {selectedIds.size > 0 && (
            <div
              className="bg-primary/5 border-primary/20 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              role="status"
              aria-live="polite"
            >
              <span className="text-sm font-medium">
                {selectedIds.size} product{selectedIds.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmBulkDelete(true)}
                  disabled={deleteMut.isPending}
                >
                  Delete selected
                </Button>
              </div>
            </div>
          )}

          <table className="w-full table-auto border-collapse">
            <thead className="bg-muted/50">
              <tr className="border-b text-left">
                <th scope="col" className="w-10 px-4 py-3">
                  {/*
                    Select-all for the visible page. `indeterminate` is set via
                    ref because React has no prop for it — without it a partial
                    selection renders as unchecked, which reads as "nothing
                    selected" while a bulk action is armed.
                  */}
                  <input
                    type="checkbox"
                    className="border-input h-4 w-4 rounded"
                    checked={allVisibleSelected}
                    ref={(node) => {
                      if (node) {
                        node.indeterminate = selectedIds.size > 0 && !allVisibleSelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    aria-label={
                      allVisibleSelected
                        ? 'Clear selection'
                        : 'Select all products on this page'
                    }
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: ProductDTO, idx: number) => (
                <tr
                  key={p.id}
                  className={`hover:bg-muted/20 border-b transition-colors ${
                    selectedIds.has(p.id) ? 'bg-primary/5' : ''
                  }`}
                  // Conveys selection to assistive technology, which a
                  // background colour alone does not.
                  aria-selected={selectedIds.has(p.id)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="border-input h-4 w-4 rounded"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelection(p.id)}
                      // Names the specific product, so a screen-reader user
                      // knows which row each checkbox belongs to.
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {((productsQuery.data?.number ?? 1) - 1) * size + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.name}</span>
                  </td>
                  <td className="px-4 py-3">{`₹${p.price.toFixed(2)}`}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        (p.stockQuantity ?? 0) > 0
                          ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                          : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                      }`}
                    >
                      {((p.stockQuantity ?? 0) > 0) ? 'In Stock' : 'Out of Stock'} (
                      {p.stockQuantity ?? 0})
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {p.categoryName ?? p.category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={APP_ROUTES.SELLER.EDIT_PRODUCT(String(p.id))}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setConfirmDeleteId(p.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Page <span className="font-semibold text-slate-200">{page}</span> / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                className="rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 disabled:opacity-45 disabled:cursor-not-allowed"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 disabled:opacity-45 disabled:cursor-not-allowed"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      )}
      {/*
        One confirmation dialog for both single and bulk delete.

        Replaces a hand-rolled modal that hardcoded `bg-white` (so its text was
        invisible in dark mode) and `bg-red-600` instead of the destructive
        token, and which had no focus trap, no Escape handling and no
        `role="dialog"` — a keyboard user could tab straight out of it into the
        page behind. The design-system Dialog supplies all of that.
      */}
      <Dialog
        open={confirmDeleteId !== null || confirmBulkDelete}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null);
            setConfirmBulkDelete(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmBulkDelete
                ? `Delete ${selectedIds.size} product${selectedIds.size === 1 ? '' : 's'}?`
                : 'Delete this product?'}
            </DialogTitle>
            <DialogDescription>
              {confirmBulkDelete
                ? 'These products will be removed from your storefront and can no longer be ordered. This cannot be undone.'
                : 'This product will be removed from your storefront and can no longer be ordered. This cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDeleteId(null);
                setConfirmBulkDelete(false);
              }}
              disabled={deleteMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => {
                const ids = confirmBulkDelete
                  ? Array.from(selectedIds)
                  : confirmDeleteId !== null
                    ? [confirmDeleteId]
                    : [];

                if (ids.length > 0) deleteMut.mutate(ids);

                setConfirmDeleteId(null);
                setConfirmBulkDelete(false);
              }}
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

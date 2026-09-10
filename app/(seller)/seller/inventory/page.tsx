'use client';

/**
 * Seller inventory management.
 *
 * [CORRECTNESS] This page previously changed nothing. Its entire table was a
 * module-level `MOCK_INVENTORY` constant — five invented SKUs shown identically
 * to every seller — and `handleStockUpdate` mutated `useState` only. A seller
 * who set a sold-out product to zero saw it as out of stock while the
 * storefront kept selling it, producing oversells and cancellations while the
 * seller reasonably believed they had acted. The "Save Changes" and "Filter"
 * buttons in the header had no handlers at all.
 *
 * It now reads and writes the real inventory endpoints, batches a stock-take
 * into a single atomic request, and rolls back visibly when a write fails.
 *
 * @see features/inventory/hooks/use-inventory — optimistic update + rollback
 */

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Badge } from '@/shared/ui/atoms/badge';
import {
  Package,
  Search,
  AlertTriangle,
  Save,
  Loader2,
  RotateCcw,
  PackageX,
} from 'lucide-react';
import { useInventory, useAdjustStock } from '@/features/inventory/hooks/use-inventory';
import {
  deriveStockStatus,
  type InventoryItemDTO,
  type StockStatus,
} from '@/features/inventory/api/inventory-api';
import { env } from '@/env';

// ============================================================
// 1. PRESENTATION MAPPING
// ============================================================

/**
 * Status presentation, driven by semantic design tokens.
 *
 * The previous version hardcoded `bg-green-100 text-green-700` and friends,
 * which have no dark-theme variant — the badges rendered as pale-on-pale in
 * dark mode. These map onto the token set the rest of the design system uses.
 */
const STATUS_PRESENTATION: Record<StockStatus, { label: string; className: string }> = {
  IN_STOCK: { label: 'In stock', className: 'bg-success/15 text-success' },
  LOW_STOCK: { label: 'Low stock', className: 'bg-warning/15 text-warning' },
  OUT_OF_STOCK: { label: 'Out of stock', className: 'bg-destructive/15 text-destructive' },
};

const PAGE_SIZE = env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE;

/** Guards against a typo turning into a catastrophic stock figure. */
const MAX_STOCK_QUANTITY = 1_000_000;

// ============================================================
// 2. PAGE
// ============================================================

export default function SellerInventoryPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * `useDeferredValue` rather than a debounce timer: it keeps the input
   * perfectly responsive while letting React de-prioritise the resulting
   * re-query, with no timer to clean up on unmount.
   */
  const deferredSearch = useDeferredValue(searchQuery);

  const queryParams = useMemo(
    () => ({ page, size: PAGE_SIZE, search: deferredSearch.trim() || undefined }),
    [page, deferredSearch]
  );

  const { data, isLoading, isError, refetch, isFetching } = useInventory(queryParams);
  const adjustStock = useAdjustStock(queryParams);

  /**
   * Pending edits, keyed by product id.
   *
   * Held as a draft rather than written per-row so a seller can walk the whole
   * table and commit once — the natural shape of a stock-take, and what the
   * dead "Save Changes" button always implied was possible.
   */
  const [drafts, setDrafts] = useState<Record<number, number>>({});

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const dirtyCount = Object.keys(drafts).length;

  const setDraft = useCallback((productId: number, raw: string, original: number) => {
    setDrafts((current) => {
      const next = { ...current };
      const parsed = Number(raw);

      // An empty or invalid entry reverts to the stored value rather than
      // being committed as 0 — silently zeroing stock is precisely the
      // outcome this page must never produce by accident.
      if (raw === '' || !Number.isFinite(parsed) || parsed < 0) {
        delete next[productId];
        return next;
      }

      const clamped = Math.min(Math.floor(parsed), MAX_STOCK_QUANTITY);

      if (clamped === original) {
        delete next[productId];
      } else {
        next[productId] = clamped;
      }
      return next;
    });
  }, []);

  const discardDrafts = useCallback(() => setDrafts({}), []);

  const commitDrafts = useCallback(async () => {
    const adjustments = Object.entries(drafts).map(([productId, stockQuantity]) => ({
      productId: Number(productId),
      stockQuantity,
    }));
    if (adjustments.length === 0) return;

    try {
      await adjustStock.mutateAsync(adjustments);
      // Cleared only on success. A failed batch keeps the seller's edits on
      // screen so they can retry rather than retype them.
      setDrafts({});
    } catch {
      // The mutation's onError already restored the table and surfaced a toast.
    }
  }, [adjustStock, drafts]);

  // ---------- Aggregates ----------
  // Computed from the page in view, and labelled as such: presenting a
  // page-scoped count as a store-wide total would be quietly misleading.
  const summary = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const item of items) {
      const status = deriveStockStatus(item);
      if (status === 'LOW_STOCK') low += 1;
      if (status === 'OUT_OF_STOCK') out += 1;
    }
    return { total: data?.totalElements ?? items.length, low, out };
  }, [items, data?.totalElements]);

  return (
    <div className="bg-background min-h-dvh">
      <div className="container mx-auto px-4 py-6 md:px-6">
        <div className="space-y-6">
          {/* ---------- Header ---------- */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
              <p className="text-muted-foreground">
                Adjust stock levels. Changes are saved to your live catalogue.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={discardDrafts}
                disabled={dirtyCount === 0 || adjustStock.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Discard
              </Button>
              <Button onClick={commitDrafts} disabled={dirtyCount === 0 || adjustStock.isPending}>
                {adjustStock.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {adjustStock.isPending
                  ? 'Saving…'
                  : dirtyCount > 0
                    ? `Save ${dirtyCount} change${dirtyCount === 1 ? '' : 's'}`
                    : 'Save changes'}
              </Button>
            </div>
          </div>

          {/*
            Announced, so a seller relying on a screen reader learns there are
            unsaved edits without having to re-traverse the table.
          */}
          {dirtyCount > 0 && (
            <p role="status" className="text-warning text-sm">
              {dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}. Nothing is applied to your
              catalogue until you save.
            </p>
          )}

          {/* ---------- Summary ---------- */}
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="Total SKUs"
              value={summary.total}
              hint="Across your catalogue"
              icon={<Package className="text-muted-foreground h-4 w-4" aria-hidden="true" />}
            />
            <SummaryCard
              title="Low stock"
              value={summary.low}
              hint="On this page, at or below threshold"
              tone="text-warning"
              icon={<AlertTriangle className="text-warning h-4 w-4" aria-hidden="true" />}
            />
            <SummaryCard
              title="Out of stock"
              value={summary.out}
              hint="On this page, restock needed"
              tone="text-destructive"
              icon={<PackageX className="text-destructive h-4 w-4" aria-hidden="true" />}
            />
          </div>

          {/* ---------- Table ---------- */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Stock levels</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search
                    className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  <Input
                    id="inventory-search"
                    type="search"
                    placeholder="Search by name or SKU…"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    aria-label="Search inventory by product name or SKU"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <InventorySkeleton />
              ) : isError ? (
                <ErrorState onRetry={() => refetch()} />
              ) : items.length === 0 ? (
                <EmptyState hasSearch={Boolean(deferredSearch.trim())} />
              ) : (
                <>
                  {/* Horizontal scroll is confined to this container so the
                      page body never scrolls sideways on a narrow viewport. */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <caption className="sr-only">
                        Your products and their current stock levels. Edit a stock value, then save
                        your changes.
                      </caption>
                      <thead>
                        <tr className="bg-muted/50 border-b text-left">
                          <th scope="col" className="p-4 font-medium">
                            Product
                          </th>
                          <th scope="col" className="p-4 font-medium">
                            SKU
                          </th>
                          <th scope="col" className="p-4 font-medium">
                            Status
                          </th>
                          <th scope="col" className="p-4 text-right font-medium">
                            Threshold
                          </th>
                          <th scope="col" className="p-4 text-right font-medium">
                            Stock
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <InventoryRow
                            key={item.productId}
                            item={item}
                            draft={drafts[item.productId]}
                            disabled={adjustStock.isPending}
                            onChange={(raw) => setDraft(item.productId, raw, item.stockQuantity)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <nav
                      className="mt-4 flex items-center justify-between"
                      aria-label="Inventory pagination"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0 || isFetching}
                      >
                        Previous
                      </Button>
                      <span className="text-muted-foreground text-sm" aria-live="polite">
                        Page {page + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1 || isFetching}
                      >
                        Next
                      </Button>
                    </nav>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 3. PARTS
// ============================================================

function SummaryCard({
  title,
  value,
  hint,
  tone,
  icon,
}: {
  title: string;
  value: number;
  hint: string;
  tone?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${tone ?? ''}`}>{value}</div>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

/**
 * One editable stock row.
 *
 * The status badge and the highlight both derive from `deriveStockStatus`
 * applied to the *effective* quantity (draft if present, stored otherwise), so
 * a seller sees the consequence of an edit before committing it.
 */
function InventoryRow({
  item,
  draft,
  disabled,
  onChange,
}: {
  item: InventoryItemDTO;
  draft: number | undefined;
  disabled: boolean;
  onChange: (raw: string) => void;
}) {
  const effectiveQuantity = draft ?? item.stockQuantity;
  const status = deriveStockStatus({ ...item, stockQuantity: effectiveQuantity });
  const presentation = STATUS_PRESENTATION[status];
  const isDirty = draft !== undefined;

  return (
    <tr className={`hover:bg-muted/20 border-b transition-colors ${isDirty ? 'bg-warning/5' : ''}`}>
      <th scope="row" className="p-4 text-left font-medium">
        {item.name}
      </th>
      <td className="text-muted-foreground p-4 font-mono text-xs">{item.sku}</td>
      <td className="p-4">
        <Badge variant="secondary" className={presentation.className}>
          {presentation.label}
        </Badge>
      </td>
      <td className="text-muted-foreground p-4 text-right tabular-nums">
        {item.lowStockThreshold}
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {isDirty && (
            <span className="text-muted-foreground text-xs line-through tabular-nums">
              {item.stockQuantity}
            </span>
          )}
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_STOCK_QUANTITY}
            className="h-9 w-24 text-right tabular-nums"
            value={effectiveQuantity}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            // Every input needs its own name: a table of identically-labelled
            // spin buttons is unusable with a screen reader.
            aria-label={`Stock quantity for ${item.name}`}
          />
        </div>
      </td>
    </tr>
  );
}

function InventorySkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your inventory…</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-muted h-12 animate-pulse rounded" aria-hidden="true" />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertTriangle className="text-destructive h-8 w-8" aria-hidden="true" />
      <p className="font-medium" role="alert">
        We couldn&apos;t load your inventory
      </p>
      <p className="text-muted-foreground max-w-sm text-sm">
        This is usually temporary. Your stock levels have not been changed.
      </p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Package className="text-muted-foreground h-8 w-8 opacity-50" aria-hidden="true" />
      <p className="font-medium">{hasSearch ? 'No matching products' : 'No products yet'}</p>
      <p className="text-muted-foreground max-w-sm text-sm">
        {hasSearch
          ? 'Try a different product name or SKU.'
          : 'Once you add products to your catalogue, their stock levels appear here.'}
      </p>
    </div>
  );
}

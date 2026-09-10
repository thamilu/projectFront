'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { logger } from '@/core/telemetry/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Badge } from '@/shared/ui/atoms/badge';
import { CheckboxField } from '@/shared/ui/atoms/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/atoms/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { ConfirmDialog } from '@/shared/ui/molecules/ConfirmDialog';
import { useWishlist } from '@/features/wishlist/hooks/use-wishlist';
import { useCart } from '@/features/cart/hooks/use-cart';
import { shareUrl } from '@/shared/utils/share';
import { APP_ROUTES } from '@/shared/routes';
import { toast } from 'sonner';
import {
  Heart,
  ShoppingCart,
  Search,
  Filter,
  Share2,
  Trash2,
  Bell,
  Grid,
  List,
  Loader2,
} from 'lucide-react';

interface LocalWishlistItem {
  id: number;
  wishlistItemId: number;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  inStock: boolean;
  image: string;
  category: string;
  urlSlug: string;
}

const ALL_CATEGORIES = 'all';

export default function WishlistPage() {
  const {
    wishlist,
    isLoading,
    removeFromWishlist: triggerRemove,
    removeFromWishlistAsync,
  } = useWishlist();
  const { addToCart, addToCartAsync } = useCart();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>(ALL_CATEGORIES);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [isBulkClearing, setIsBulkClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const items: LocalWishlistItem[] = useMemo(
    () =>
      wishlist?.data?.content?.map((item) => {
        const product = item.product;
        // Regression fix: price/originalPrice were previously swapped — the
        // bold "current price" showed the pre-discount price and the
        // strikethrough showed the actual (lower) sale price, exactly
        // backwards from what "20% OFF, was $X, now $Y" is supposed to mean.
        const currentPrice = product?.discountPrice ?? product?.price ?? 0;
        const wasPrice = product?.price ?? 0;
        const discount =
          product?.discountPrice && product.price > 0
            ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
            : 0;
        return {
          id: Number(item.productId),
          wishlistItemId: item.id,
          name: product?.name || 'Unknown Product',
          price: currentPrice,
          originalPrice: wasPrice,
          discount,
          // ProductDTO has no `inStock` field — stockQuantity is the real
          // source of truth. The previous `item.product?.inStock ?? true`
          // read a field that doesn't exist on the type, so it was always
          // `undefined ?? true` — every item showed as in-stock regardless
          // of actual inventory.
          inStock: (product?.stockQuantity ?? 0) > 0,
          image: product?.imageUrl || '/placeholder-1.jpg',
          category: product?.categoryName || 'General',
          urlSlug: (product as { urlSlug?: string } | undefined)?.urlSlug || String(item.productId),
        };
      }) ?? [],
    [wishlist]
  );

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items]
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === ALL_CATEGORIES || item.category === filterCategory;
        const matchesStock = !inStockOnly || item.inStock;
        return matchesSearch && matchesCategory && matchesStock;
      }),
    [items, searchQuery, filterCategory, inStockOnly]
  );

  const activeFilterCount = (filterCategory !== ALL_CATEGORIES ? 1 : 0) + (inStockOnly ? 1 : 0);

  const totalItems = items.length;
  const avgPrice =
    // Regression fix: previously divided by items.length unconditionally —
    // an empty wishlist (items.length === 0) produced 0/0 = NaN, displaying
    // "$NaN".
    items.length > 0 ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0;
  const potentialSavings = items.reduce(
    (sum, item) => sum + (item.originalPrice - item.price),
    0
  );

  const moveToCart = (itemId: number) => {
    logger.info('Moving item to cart', { itemId });
    addToCart(
      { productId: itemId, quantity: 1 },
      {
        onSuccess: () => {
          toast.success('Product moved to cart successfully!');
          triggerRemove(itemId);
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Failed to add product to cart.');
        },
      }
    );
  };

  const removeFromWishlist = (itemId: number) => {
    triggerRemove(itemId, {
      onSuccess: () => {
        toast.success('Product removed from wishlist.');
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Failed to remove product.');
      },
    });
  };

  const shareProduct = async (item: LocalWishlistItem) => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${APP_ROUTES.PRODUCT_DETAIL(item.urlSlug)}`
        : APP_ROUTES.PRODUCT_DETAIL(item.urlSlug);
    const result = await shareUrl(item.name, url);
    if (result === 'copied') toast.success('Product link copied to clipboard');
    if (result === 'failed') toast.error('Unable to share this product');
  };

  // There is no backend endpoint for a public/shareable wishlist view (only
  // the owner can ever fetch their own wishlist) — sharing the current
  // page's URL would be useless to a recipient with no access, and a
  // previous version of this page copied a link to a /wishlist/shared/[id]
  // route that doesn't exist and would 404. Honest "not built yet" instead
  // of a broken or meaningless link.
  const shareWishlist = () => {
    toast.info('Wishlist sharing is coming soon!');
  };

  const notifyWhenAvailable = (itemName: string) => {
    toast.info(`We'll notify you when "${itemName}" is back in stock — this feature is coming soon.`);
  };

  const bulkMoveToCart = async () => {
    const inStockItems = filteredItems.filter((item) => item.inStock);
    if (inStockItems.length === 0) {
      toast.info('No in-stock items to move.');
      return;
    }

    setIsBulkMoving(true);
    const results = await Promise.allSettled(
      inStockItems.map((item) =>
        addToCartAsync({ productId: item.id, quantity: 1, silent: true }).then(() => item)
      )
    );

    const moved = results.filter(
      (r): r is PromiseFulfilledResult<LocalWishlistItem> => r.status === 'fulfilled'
    );
    const failedCount = results.length - moved.length;

    await Promise.allSettled(moved.map((r) => removeFromWishlistAsync(r.value.id)));

    setIsBulkMoving(false);

    if (moved.length > 0) {
      toast.success(
        `Moved ${moved.length} item${moved.length === 1 ? '' : 's'} to your cart` +
          (failedCount > 0 ? ` — ${failedCount} failed.` : '.')
      );
    } else {
      toast.error('Failed to move items to cart.');
    }
  };

  const confirmClearWishlist = async () => {
    setIsBulkClearing(true);
    const results = await Promise.allSettled(
      filteredItems.map((item) => removeFromWishlistAsync(item.id))
    );
    const clearedCount = results.filter((r) => r.status === 'fulfilled').length;
    const failedCount = results.length - clearedCount;

    setIsBulkClearing(false);
    setShowClearConfirm(false);

    if (clearedCount > 0) {
      toast.success(
        `Removed ${clearedCount} item${clearedCount === 1 ? '' : 's'} from your wishlist` +
          (failedCount > 0 ? ` — ${failedCount} failed.` : '.')
      );
    } else {
      toast.error('Failed to clear wishlist.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <Badge variant="secondary">{totalItems} items</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Analytics Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Items</span>
                  <Badge variant="outline">{totalItems}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Price</span>
                  <span className="font-medium">${avgPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Potential Savings</span>
                  <span className="font-medium text-green-600">
                    ${potentialSavings.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters and Controls */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="relative max-w-md flex-1">
                      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                      <Input
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="relative">
                          <Filter className="mr-2 h-4 w-4" />
                          Filter
                          {activeFilterCount > 0 && (
                            <Badge
                              variant="default"
                              className="ml-2 h-5 min-w-5 rounded-full px-1 text-[10px]"
                            >
                              {activeFilterCount}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium" htmlFor="wishlist-category-filter">
                            Category
                          </label>
                          <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger id="wishlist-category-filter">
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <CheckboxField
                          label="In stock only"
                          checked={inStockOnly}
                          onCheckedChange={(checked) => setInStockOnly(checked === true)}
                        />

                        {activeFilterCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setFilterCategory(ALL_CATEGORIES);
                              setInStockOnly(false);
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                      aria-pressed={viewMode === 'grid'}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      aria-label="List view"
                      aria-pressed={viewMode === 'list'}
                    >
                      <List className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={shareWishlist}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Grid/List */}
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                  <h2 className="mb-2 text-xl font-semibold">
                    {searchQuery || activeFilterCount > 0 ? 'No items found' : 'Your wishlist is empty'}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || activeFilterCount > 0
                      ? 'Try adjusting your search or filters.'
                      : 'Start adding items you love to your wishlist.'}
                  </p>
                  {!searchQuery && activeFilterCount === 0 && (
                    <Button asChild>
                      <Link href="/products">Browse Products</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
                }`}
              >
                {filteredItems.map((item) => (
                  <Card key={item.id} className="group transition-all hover:shadow-lg">
                    <CardContent className="p-0">
                      <div className="relative">
                        {/* Product Image */}
                        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Remove ${item.name} from wishlist`}
                            className="absolute top-3 right-3 text-red-500 hover:text-red-600 bg-white/80 backdrop-blur-sm rounded-full p-1.5 h-auto"
                            onClick={() => removeFromWishlist(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <div className="mb-2">
                            <h3 className="line-clamp-2 text-lg font-semibold">{item.name}</h3>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                          </div>

                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-2xl font-bold">${item.price.toFixed(2)}</span>
                            {item.discount > 0 && (
                              <>
                                <span className="text-muted-foreground text-sm line-through">
                                  ${item.originalPrice.toFixed(2)}
                                </span>
                                <Badge className="border-green-200 bg-green-100 text-green-800">
                                  {item.discount}% OFF
                                </Badge>
                              </>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => moveToCart(item.id)}
                              disabled={!item.inStock}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label={`Share ${item.name}`}
                              onClick={() => shareProduct(item)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {!item.inStock && (
                            <div className="mt-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600"
                                onClick={() => notifyWhenAvailable(item.name)}
                              >
                                <Bell className="mr-1 h-4 w-4" />
                                Notify when available
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {filteredItems.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} shown
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkMoveToCart}
                    disabled={isBulkMoving || !filteredItems.some((item) => item.inStock)}
                  >
                    {isBulkMoving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Move All to Cart
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareWishlist}>
                    Share Wishlist
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setShowClearConfirm(true)}
                  >
                    Clear Wishlist
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear wishlist?"
        description={
          filteredItems.length === items.length
            ? `This removes all ${items.length} item${items.length === 1 ? '' : 's'} from your wishlist. This cannot be undone.`
            : `This removes the ${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'} currently shown (matching your search/filters) from your wishlist. This cannot be undone.`
        }
        confirmLabel="Clear Wishlist"
        destructive
        isLoading={isBulkClearing}
        onConfirm={confirmClearWishlist}
      />
    </div>
  );
}

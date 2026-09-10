'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useWishlistToggle } from '@/features/wishlist/hooks/use-wishlist-toggle';
import { useInventoryUpdates } from '@/features/orders/hooks/use-order-updates';
import { formatPrice, calculateDiscount } from '@/shared/utils';
import { sanitizeHtml } from '@/shared/utils/sanitize';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';
import { ShoppingCart, Heart, Star, Truck, Shield } from 'lucide-react';

interface ProductDetailClientProps {
  product: ProductDTO;
}

const DESCRIPTION_PREVIEW_LENGTH = 200;

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart, isAdding } = useCart();
  const { isInWishlist: inWishlist, toggle: toggleWishlist } = useWishlistToggle(product);
  // Live stock pushed over WebSocket (see useInventoryUpdates) overrides the
  // page's initially-fetched stockQuantity once a message arrives, so a
  // customer viewing this page as the last unit sells out elsewhere sees it
  // go out of stock without needing to refresh.
  const { stock: liveStock } = useInventoryUpdates(String(product.id));
  const effectiveStock = liveStock ?? product.stockQuantity;

  // Keeps the quantity selector valid if live stock drops below the
  // previously-selected quantity while this page is open.
  useEffect(() => {
    setQuantity((q) => Math.min(q, Math.max(1, effectiveStock)));
  }, [effectiveStock]);

  useEffect(() => {
    import('@/platform/events')
      .then(({ eventBus }) => {
        eventBus.publish('ProductViewed', {
          productId: product.id,
          name: product.name,
          categoryId: product.category?.id || 0,
        });
      })
      .catch(() => {});
  }, [product.id, product.name, product.category?.id]);

  const discountPercent = product.discountPrice
    ? calculateDiscount(product.price, product.discountPrice)
    : 0;

  // addToCart/toggleWishlist are React Query mutations (fire-and-forget);
  // success/error toasts are handled centrally by useCart/useWishlistToggle
  // so every entry point (product card, PDP, header) shows one consistent
  // message instead of each call site guessing at its own copy.
  const handleAddToCart = () => {
    addToCart({ productId: product.id, quantity });
  };

  const handleWishlistToggle = () => {
    toggleWishlist();
  };

  const images = product.images ?? (product.imageUrl ? [{ id: product.id, url: product.imageUrl }] : []);
  const hasImages = images.length > 0;

  const descriptionPreview =
    product.description && product.description.length > DESCRIPTION_PREVIEW_LENGTH
      ? `${product.description.substring(0, DESCRIPTION_PREVIEW_LENGTH)}...`
      : product.description;

  const reviewsHref = `/products/${product.urlSlug || product.id}/reviews`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground mb-6 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/products?categoryId=${product.category.id}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="bg-muted relative aspect-square overflow-hidden rounded-lg border">
            {hasImages ? (
              <Image
                src={images[selectedImage].url}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                No image available
              </div>
            )}
            {discountPercent > 0 && (
              <Badge className="absolute top-4 right-4 bg-red-500">-{discountPercent}%</Badge>
            )}
          </div>

          {/* Thumbnail Images */}
          {hasImages && images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1} of ${product.name}`}
                  aria-pressed={selectedImage === index}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary ring-primary ring-2 ring-offset-2'
                      : 'hover:border-muted-foreground border-transparent'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 15vw"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {product.brand && (
              <p className="text-muted-foreground mt-2">
                Brand:{' '}
                <Link
                  href={`/products?brandId=${product.brand.id}`}
                  className="text-primary hover:underline"
                >
                  {product.brand.name}
                </Link>
              </p>
            )}
          </div>

          {/* Rating */}
          {product.averageRating != null && (
            <Link href={reviewsHref} className="flex items-center gap-2 hover:underline">
              <div className="flex" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(product.averageRating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">
                {product.averageRating.toFixed(1)} ({product.reviewCount || 0} reviews)
              </span>
            </Link>
          )}

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatPrice(product.discountPrice || product.price)}
              </span>
              {product.discountPrice && (
                <span className="text-muted-foreground text-xl line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {effectiveStock > 0 ? (
              <Badge variant="outline" className="border-green-500 text-green-500">
                In Stock ({effectiveStock} available)
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-500">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Short Description */}
          {descriptionPreview && <p className="text-muted-foreground">{descriptionPreview}</p>}

          {/* Quantity Selector */}
          {effectiveStock > 0 && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium" id="quantity-label">
                Quantity:
              </label>
              <div className="flex items-center gap-2" role="group" aria-labelledby="quantity-label">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </Button>
                <span className="w-12 text-center" aria-live="polite">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                  disabled={quantity >= effectiveStock}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleAddToCart}
              disabled={isAdding || effectiveStock === 0}
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlistToggle}
              aria-pressed={inWishlist}
              aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            >
              <Heart
                className={`h-5 w-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`}
                aria-hidden="true"
              />
            </Button>
          </div>

          {/* Additional Info */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Truck className="text-muted-foreground h-5 w-5" aria-hidden="true" />
              <div>
                <p className="font-medium">Free Delivery</p>
                <p className="text-muted-foreground text-sm">For orders over ₹500</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="text-muted-foreground h-5 w-5" aria-hidden="true" />
              <div>
                <p className="font-medium">Secure Payment</p>
                <p className="text-muted-foreground text-sm">100% secure transactions</p>
              </div>
            </div>
          </div>

          {/* SKU and Tags */}
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>SKU: {product.sku}</p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Sections */}
      <div className="mt-12">
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Product Description</CardTitle>
            </CardHeader>
            <CardContent>
              {product.descriptionHtml ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(product.descriptionHtml),
                  }}
                />
              ) : (
                <p className="whitespace-pre-line">
                  {product.description || 'No description available.'}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle as="h2">Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex">
                    <dt className="w-1/3 font-medium">SKU:</dt>
                    <dd>{product.sku}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/3 font-medium">Category:</dt>
                    <dd>{product.category?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/3 font-medium">Brand:</dt>
                    <dd>{product.brand?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/3 font-medium">Stock:</dt>
                    <dd>{effectiveStock} units</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle as="h2">Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-3">
                {product.averageRating != null ? (
                  <p className="text-muted-foreground text-sm">
                    Rated {product.averageRating.toFixed(1)} out of 5 from{' '}
                    {product.reviewCount || 0} review{product.reviewCount === 1 ? '' : 's'}.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">No reviews yet — be the first.</p>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href={reviewsHref}>View all reviews</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

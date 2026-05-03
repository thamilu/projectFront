"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Tabs component not available in the shared UI library in this workspace.
// Replace with simple accessible sections instead of Tabs to avoid missing import.
import { useCart } from '@/features/cart/hooks/use-cart';
import { useWishlistStore } from '@/store/wishlist-store';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { ProductDTO } from '@/types';
import { ShoppingCart, Heart, Star, Truck, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ProductDetailClientProps {
  product: ProductDTO;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart, isAdding } = useCart();
  const wishlistState = useWishlistStore();

  const inWishlist = wishlistState.wishlists
    .flatMap((w) => w.items)
    .some((i) => i.productId === product.id);
  const discountPercent = product.discountPrice
    ? calculateDiscount(product.price, product.discountPrice)
    : 0;

  const handleAddToCart = async () => {
    try {
      await addToCart({ productId: product.id, quantity });
      toast.success('Added to cart', {
        description: `${product.name} x${quantity}`,
      });
    } catch (_error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlistToggle = async () => {
    try {
      const wishlistId = wishlistState.wishlists[0]?.id ?? Date.now();

      if (inWishlist) {
        const found = wishlistState.wishlists.flatMap((w) => w.items).find((i) => i.productId === product.id);
        if (found) {
          wishlistState.removeItemFromWishlist(wishlistId, found.id);
          toast.success('Removed from wishlist');
        }
      } else {
        wishlistState.addItemToWishlist(wishlistId, {
          productId: product.id,
          name: product.name,
          price: product.discountPrice || product.price,
          originalPrice: product.price,
          image: product.imageUrl || '',
          category: product.category?.name || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rating: (product as any).averageRating || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reviews: (product as any).reviewCount || 0,
          inStock: product.stockQuantity > 0,
          priceDropAlert: false,
        });
        toast.success('Added to wishlist');
      }
    } catch (_error) {
      toast.error('Failed to update wishlist');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images = ((product as any).images as { id?: number; url: string }[] | undefined) ?? (product.imageUrl ? [{ id: product.id, url: product.imageUrl }] : []);
  const hasImages = images.length > 0;

  return ( 
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/products?categoryId=${product.category.id}`} className="hover:text-foreground">
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
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
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
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
            {discountPercent > 0 && (
              <Badge className="absolute right-4 top-4 bg-red-500">
                -{discountPercent}%
              </Badge>
            )}
          </div>

          {/* Thumbnail Images */}
          {hasImages && images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image: { id?: number; url: string }, index: number) => (
                <button 
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-transparent hover:border-muted-foreground'
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
              <p className="mt-2 text-muted-foreground">
                Brand: <Link href={`/products?brandId=${product.brand.id}`} className="text-primary hover:underline">{product.brand.name}</Link>
              </p>
            )}
          </div>

          {/* Rating */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(product as any).averageRating && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i: number) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      i < Math.round(((product as any).averageRating || 0))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {( (product as any).averageRating ? (product as any).averageRating.toFixed(1) : '0.0' )} ({(product as any).reviewCount || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatPrice(product.discountPrice || product.price)}
              </span>
              {product.discountPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {product.stockQuantity > 0 ? (
              <Badge variant="outline" className="border-green-500 text-green-500">
                In Stock ({product.stockQuantity} available)
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-500">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Short Description */}
          {product.description && (
            <p className="text-muted-foreground">{product.description.substring(0, 200)}...</p>
          )}

          {/* Quantity Selector */}
          {product.stockQuantity > 0 && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  disabled={quantity >= product.stockQuantity}
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
              disabled={isAdding || product.stockQuantity === 0}
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlistToggle}
            >
              <Heart className={`h-5 w-5 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {/* Additional Info */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Free Delivery</p>
                <p className="text-sm text-muted-foreground">For orders over ₹500</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Secure Payment</p>
                <p className="text-sm text-muted-foreground">100% secure transactions</p>
              </div>
            </div>
          </div>

          {/* SKU and Tags */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>SKU: {product.sku}</p>
            {product.tags && product.tags.length > 0 && (

              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <Badge key={(tag as any).id} variant="secondary">{(tag as any).name}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Description</CardTitle>
              </CardHeader>
                  <CardContent>
                    {('descriptionHtml' in product && product.descriptionHtml) ? (
                      <div
                        className="prose max-w-none"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(String((product as any).descriptionHtml)) }}
                      />
                    ) : (
                      <p className="whitespace-pre-line">{product.description || 'No description available.'}</p>
                    )}
                  </CardContent>
            </Card>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
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
                      <dd>{product.stockQuantity} units</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Reviews feature coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}

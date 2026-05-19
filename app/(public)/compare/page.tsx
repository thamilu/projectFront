'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, X, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

const MOCK_PRODUCTS = [
  { id: 'p1', slug: 'wireless-earbuds-pro', name: 'Wireless Earbuds Pro', price: 2499, rating: 4.5, battery: '6h', warranty: '1 year', connectivity: 'Bluetooth 5.3', weight: '58g' },
  { id: 'p2', slug: 'noise-cancelling-headphones', name: 'NC Headphones X1', price: 5999, rating: 4.8, battery: '30h', warranty: '2 years', connectivity: 'Bluetooth 5.2', weight: '250g' },
];

type Spec = { label: string; key: keyof typeof MOCK_PRODUCTS[0] };

const SPECS: Spec[] = [
  { label: 'Price', key: 'price' },
  { label: 'Rating', key: 'rating' },
  { label: 'Battery Life', key: 'battery' },
  { label: 'Warranty', key: 'warranty' },
  { label: 'Connectivity', key: 'connectivity' },
  { label: 'Weight', key: 'weight' },
];

export default function ComparePage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const removeProduct = (id: string) => setProducts(p => p.filter(pr => pr.id !== id));

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Compare Products</h1>
      </div>

      {products.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>No products to compare.</p>
          <Link href={APP_ROUTES.PRODUCTS}>
            <Button className="mt-4">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-separate border-spacing-3">
            <thead>
              <tr>
                <th className="w-32 text-left text-sm font-semibold text-muted-foreground" />
                {products.map(p => (
                  <th key={p.id} className="w-48">
                    <Card>
                      <CardContent className="relative pt-5 pb-4 text-center">
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="absolute right-2 top-2 rounded-full p-1 hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="mb-2 flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-muted">
                          <BarChart3 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold leading-snug">{p.name}</p>
                        <Link href={APP_ROUTES.PRODUCT_DETAIL(p.slug)} className="mt-1 text-xs text-primary hover:underline">
                          View Product
                        </Link>
                      </CardContent>
                    </Card>
                  </th>
                ))}
                {products.length < 4 && (
                  <th className="w-48">
                    <Card className="border-dashed">
                      <CardContent className="flex h-full min-h-36 items-center justify-center pt-6">
                        <Link href={APP_ROUTES.PRODUCTS} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                          <Plus className="h-8 w-8" />
                          <span className="text-sm">Add product</span>
                        </Link>
                      </CardContent>
                    </Card>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {SPECS.map(spec => (
                <tr key={spec.key}>
                  <td className="py-2 text-sm font-medium text-muted-foreground">{spec.label}</td>
                  {products.map(p => (
                    <td key={p.id} className="rounded-lg bg-muted/30 py-3 text-center text-sm">
                      {spec.key === 'price' ? `₹${(p[spec.key] as number).toLocaleString('en-IN')}` : String(p[spec.key])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {products.map(p => (
                  <td key={p.id} className="pt-2 text-center">
                    <Button size="sm" asChild>
                      <Link href={APP_ROUTES.PRODUCT_DETAIL(p.slug)}>Add to Cart</Link>
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ChevronDown, Smartphone, Home, Shirt, Dumbbell, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/atoms/popover';

import { useState, useEffect } from 'react';
import { productApi } from '@/features/products/api/product-api';
import { CategoryDTO } from '@/domains/catalog/contracts/catalog.types';

interface DisplayCategory {
  name: string;
  href: string;
  icon: React.ReactNode;
  subcategories?: { name: string; href: string }[];
}

function mapToDisplay(categories: CategoryDTO[]): DisplayCategory[] {
  // simple icon fallback mapping
  const getIcon = (name: string) => {
    const lo = name.toLowerCase();
    if (lo.includes('electronic') || lo.includes('tech')) return <Smartphone className="h-5 w-5" />;
    if (lo.includes('fashion') || lo.includes('cloth')) return <Shirt className="h-5 w-5" />;
    if (lo.includes('home') || lo.includes('liv')) return <Home className="h-5 w-5" />;
    if (lo.includes('sport') || lo.includes('fit') || lo.includes('health')) return <Dumbbell className="h-5 w-5" />;
    return <ChevronRight className="h-5 w-5" />; // default
  };
  
  return categories.map(c => ({
    name: c.name,
    href: `/products?categoryId=${c.id}`,
    icon: getIcon(c.name),
    subcategories: c.children?.map(sub => ({
      name: sub.name,
      href: `/products?categoryId=${sub.id}`
    }))
  }));
}

/**
 * Category Mega Menu Component
 * Enterprise standard: Category navigation with subcategories
 */
export default function CategoryMenu() {
  const [categories, setCategories] = useState<DisplayCategory[]>([]);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (!open) return; // Fetch only when opened or pre-fetch on hover if wanted
    // Minimal fetch on open
    productApi.getCategoryTree().then(data => {
      setCategories(mapToDisplay(data));
    }).catch(console.error);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-9 gap-1 font-medium" suppressHydrationWarning>
          All Categories
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[650px] p-4">
        {categories.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {categories.map((category) => (
            <div key={category.name} className="space-y-3">
              <Link
                href={category.href}
                className="hover:text-primary group flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                {category.icon}
                <span>{category.name}</span>
                <ChevronRight className="-ml-1 h-4 w-4 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100" />
              </Link>
              {category.subcategories && (
                <ul className="space-y-2">
                  {category.subcategories.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.href}
                        className="text-muted-foreground hover:text-foreground block text-sm transition-colors hover:underline"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          </div>
        )}

        <div className="mt-4 border-t pt-4">
          <Link
            href="/categories"
            className="text-primary text-sm font-medium hover:underline"
          >
            View All Categories →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

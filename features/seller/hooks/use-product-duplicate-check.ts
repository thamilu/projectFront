'use client';

import { useState, useEffect } from 'react';
import { productsApi } from '@/domains/catalog/infrastructure/api/catalog-api';
import { logger } from '@/core/telemetry/logger';

export function useProductDuplicateCheck(productName: string | undefined, enabled: boolean) {
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isInlineSearching, setIsInlineSearching] = useState(false);
  const [checkedNames, setCheckedNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !productName || productName.trim().length < 4) {
      return;
    }

    const normalizedName = productName.trim().toLowerCase();
    if (checkedNames.has(normalizedName)) {
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setIsInlineSearching(true);
        // X-Bypass-Toast: this is an ambient, as-you-type background check —
        // the seller never explicitly submitted a search, so a transient
        // failure here must not surface the global "Access Denied"/"Server
        // Error" toast (the same pattern already fixed for the wishlist/
        // cart/notifications background reads elsewhere in this codebase).
        const response = await productsApi.getMasterProducts(
          {
            search: productName.trim(),
            page: 0,
            size: 5,
          },
          { headers: { 'X-Bypass-Toast': 'true' } }
        );
        const items = response.content || [];

        if (items.length > 0) {
          setCheckedNames((prev) => {
            const next = new Set(prev);
            next.add(normalizedName);
            return next;
          });
          setSimilarProducts(items);
          setShowDuplicateDialog(true);
        }
      } catch (err) {
        logger.warn('Failed to run real-time duplicate check', { error: err });
      } finally {
        setIsInlineSearching(false);
      }
    }, 1000); // 1-second debounce

    return () => clearTimeout(handler);
  }, [productName, enabled, checkedNames]);

  return {
    similarProducts,
    showDuplicateDialog,
    setShowDuplicateDialog,
    isInlineSearching,
  };
}

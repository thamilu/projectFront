'use client';

import { useState, useEffect } from 'react';
import { ShippingOption } from '../types';

export function useShippingCalculator(subtotal: number) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API query with dynamic business rule pricing
    setIsLoading(true);
    const timer = setTimeout(() => {
      const standardCost = subtotal > 1000 ? 0 : 80; // Free shipping over INR 1000
      const expressCost = subtotal > 3000 ? 100 : 250;

      setOptions([
        {
          id: 'standard',
          name: 'Standard Delivery',
          description: 'Reliable ground shipping to your doorstep',
          cost: standardCost,
          currency: 'INR',
          estimatedDaysMin: 3,
          estimatedDaysMax: 5,
        },
        {
          id: 'express',
          name: 'Express Delivery',
          description: 'Expedited air courier processing',
          cost: expressCost,
          currency: 'INR',
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
        },
        {
          id: 'sameday',
          name: 'Same Day Fulfillment',
          description: 'Instant local priority transit (metro cities only)',
          cost: 450,
          currency: 'INR',
          estimatedDaysMin: 0,
          estimatedDaysMax: 1,
        },
      ]);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [subtotal]);

  return { options, isLoading };
}

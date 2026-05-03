'use client';

import { X, Truck, Shield, Zap } from 'lucide-react';
import { useState } from 'react';

/**
 * Promotional Banner Component
 * Enterprise standard: Top banner with promotional message and dismissal
 */
export default function PromotionalBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="hidden items-center gap-2 md:flex">
            <Truck className="h-4 w-4" />
            <span className="font-medium">Free Shipping Over ₹500</span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="font-medium">Flash Sale: Up to 70% Off</span>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Shield className="h-4 w-4" />
            <span className="font-medium">100% Secure Checkout</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 transition-colors hover:bg-white/10"
        aria-label="Close promotional banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Legacy Bridge Type Definitions
 */

export interface LegacyBridge {
  trackPurchase?: (amount: number, category: string) => void;
}

declare global {
  interface Window {
    __legacy?: LegacyBridge;
    trackPurchase?: (amount: number, category: string) => void;
  }
}

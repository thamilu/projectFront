/**
 * Analytics Service
 * Handles analytics and tracking
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export class AnalyticsService {
  track(event: string, properties?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;

    const eventData: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date(),
    };

    // Send to analytics service (Google Analytics, Mixpanel, etc.)
    // eslint-disable-next-line no-console
    console.log('Analytics Event:', eventData);
  }

  trackPageView(path: string): void {
    this.track('page_view', { path });
  }

  trackProductView(productId: string, productName: string): void {
    this.track('product_view', { productId, productName });
  }

  trackAddToCart(productId: string, quantity: number, price: number): void {
    this.track('add_to_cart', { productId, quantity, price });
  }

  trackPurchase(orderId: string, total: number, items: number): void {
    this.track('purchase', { orderId, total, items });
  }

  trackSearch(query: string, resultsCount: number): void {
    this.track('search', { query, resultsCount });
  }
}

export const analyticsService = new AnalyticsService();

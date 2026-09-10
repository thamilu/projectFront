import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, type CreateReturnRequest } from '../api/order-api';
import { PageRequest } from '@/shared/types';
import {
  CreateOrderRequest,
  OrderFilters,
  OrderStatus,
} from '@/domains/order/contracts/order.types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * Query Key Factory for Orders
 *
 * Standardizes query keys so a mutation can invalidate exactly the caches it
 * affects — previously every mutation here only invalidated the `['orders']`
 * list, never the specific `['order', id]`/`['order', 'number', ...]` detail
 * caches, so a customer viewing an order's detail page while cancelling it
 * (or having its status changed) kept seeing the stale, pre-mutation status
 * until they navigated away and back.
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: PageRequest & OrderFilters) => [...orderKeys.lists(), params] as const,
  // Seller-scoped orders are a distinct backend resource (see
  // orderApi.getSellerOrders) from a customer's own order list, so they get
  // their own cache namespace rather than sharing `lists()` — invalidating
  // one must never accidentally invalidate (or be invalidated by) the other.
  sellerLists: () => [...orderKeys.all, 'seller-list'] as const,
  sellerList: (params: PageRequest & OrderFilters) =>
    [...orderKeys.sellerLists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  detailByNumber: (orderNumber: string) =>
    [...orderKeys.details(), 'number', orderNumber] as const,
  tracking: (id: number) => [...orderKeys.all, 'tracking', id] as const,
};

// Time Complexity: O(1) for hook setup, O(n) for order operations where n is orders/items count
// Space Complexity: O(n) where n is number of orders
export function useOrders(params: PageRequest & OrderFilters) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: ({ signal }) => orderApi.getOrders(params, { signal }),
  });
}

// Time Complexity: O(1) for hook setup, O(n) for order operations where n is orders/items count
// Space Complexity: O(n) where n is number of orders
export function useSellerOrders(
  params: PageRequest & OrderFilters,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: orderKeys.sellerList(params),
    queryFn: ({ signal }) => orderApi.getSellerOrders(params, { signal }),
    enabled: options.enabled ?? true,
  });
}

// Time Complexity: O(1)
// Space Complexity: O(n) where n is order items count
export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => orderApi.getOrderById(id, { signal }),
    enabled: !!id,
  });
}

// Time Complexity: O(1)
// Space Complexity: O(n)
export function useOrderByNumber(orderNumber: string) {
  return useQuery({
    queryKey: orderKeys.detailByNumber(orderNumber),
    queryFn: ({ signal }) => orderApi.getOrderByNumber(orderNumber, { signal }),
    enabled: !!orderNumber,
  });
}

// Time Complexity: O(1) for hook
// Space Complexity: O(n) where n is order items
/**
 * @param options.redirectOnSuccess - Defaults to true (navigate straight to
 * the order confirmation page once the order is created — the right
 * behavior for a flow with no further steps, e.g. cash-on-delivery). Pass
 * false when a payment step still needs to run against the created order
 * before it's safe to navigate away (see the Stripe checkout flow in
 * app/(customer)/checkout/page.tsx, which creates the order first, then
 * collects payment, then navigates itself once payment succeeds).
 */
export function useCreateOrder(options?: { redirectOnSuccess?: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const redirectOnSuccess = options?.redirectOnSuccess ?? true;

  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => orderApi.createOrder(orderData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Order placed successfully');
      if (redirectOnSuccess) {
        router.push(`/orders/${data.id}`);
      }
    },
    onError: () => {
      toast.error('Failed to create order');
    },
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      orderApi.updateOrderStatus(id, { orderStatus: status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.sellerLists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => orderApi.cancelOrder(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      toast.success('Order cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });
}

/**
 * Live tracking for a single order.
 *
 * Polls while the shipment is still moving. A delivered or cancelled order is
 * terminal, so polling stops — continuing would be pure waste on a page a
 * customer may leave open for hours.
 */
export function useOrderTracking(orderId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: orderKeys.tracking(orderId),
    queryFn: ({ signal }) => orderApi.getOrderTracking(orderId, { signal }),
    enabled: (options?.enabled ?? true) && Number.isFinite(orderId) && orderId > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status?.toUpperCase();
      const isTerminal = status === 'DELIVERED' || status === 'CANCELLED' || status === 'RETURNED';
      return isTerminal ? false : 60_000;
    },
    // Tracking is inherently time-sensitive; a cached value shown after a
    // refocus should be refreshed rather than trusted.
    staleTime: 30_000,
  });
}

/**
 * Submit a return/refund request against an order.
 *
 * No toast is fired here: the returns page needs to show the returned
 * reference number and route the customer onward, which a generic toast
 * cannot do. Errors, however, are surfaced generically since every failure
 * mode reads the same to the customer.
 */
export function useCreateReturnRequest(orderId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateReturnRequest) => orderApi.createReturnRequest(orderId, request),
    onSuccess: () => {
      // The order's own status changes to RETURN_REQUESTED, so both the detail
      // view and any list showing status must be refetched.
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

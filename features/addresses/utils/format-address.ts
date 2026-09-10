import type { AddressDTO } from '../api/address-api';

/**
 * Flattens a structured AddressDTO into the single-line string format
 * CreateOrderRequest.shippingAddress/billingAddress expects
 * (domains/order/contracts/order.types.ts) — the backend's order model
 * stores addresses as free text, not a structured shape, so this is the
 * one place that boundary gets crossed rather than duplicating the
 * formatting logic at every call site.
 */
export function formatAddressForOrder(address: AddressDTO): string {
  const lines = [
    address.name,
    [address.line1, address.line2].filter(Boolean).join(', '),
    `${address.city}, ${address.state} ${address.pincode}`,
    address.phone ? `Phone: ${address.phone}` : undefined,
  ].filter(Boolean);

  return lines.join(' | ');
}

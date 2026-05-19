export interface StoreNameFields {
  id?: number | string;
  storeName?: string | null;
  shopName?: string | null;
  name?: string | null;
}

/**
 * Returns a user-facing store name by checking common fields.
 */
export function getStoreDisplayName(store: StoreNameFields, fallback = 'Unnamed Store'): string {
  return store.storeName?.trim() || store.shopName?.trim() || store.name?.trim() || fallback;
}

/**
 * Generates up to two initials for avatar fallbacks.
 */
export function getStoreInitials(name: string, length = 2): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, length)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Deterministic pastel color background based on store id.
 */
export function getStoreAvatarColor(id: number | string | undefined): string {
  if (typeof id === 'number' && Number.isFinite(id)) {
    const hue = (id * 47) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  }

  const numeric = Number.parseInt(String(id ?? 0).replace(/[^0-9]/g, ''), 10) || 0;
  const hue = (numeric * 47) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

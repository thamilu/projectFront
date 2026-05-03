const SELLER_PENDING_STORAGE_KEY = 'seller_onboarding_pending';

export function getLocalPendingFlag(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SELLER_PENDING_STORAGE_KEY) === 'true';
}

export function setLocalPendingFlag(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(SELLER_PENDING_STORAGE_KEY, 'true');
  } else {
    window.localStorage.removeItem(SELLER_PENDING_STORAGE_KEY);
  }
}

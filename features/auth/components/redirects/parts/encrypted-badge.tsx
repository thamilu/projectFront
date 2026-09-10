'use client';

/**
 * EncryptedBadge
 *
 * Decorative "Encrypted Connection" badge row rendered at the bottom
 * of the redirect card while the redirect is in progress.
 *
 * Fully decorative (`aria-hidden="true"`) — conveys visual trust signal
 * to sighted users only; not announced by screen readers.
 *
 * @module features/auth/components/redirects/parts/encrypted-badge
 */

interface EncryptedBadgeProps {
  /** Badge label text. Supports i18n — pass translated string from parent. */
  label: string;
}

/**
 * Decorative horizontal rule with centred label text.
 * aria-hidden — sighted-only trust signal.
 */
export function EncryptedBadge({ label }: EncryptedBadgeProps) {
  return (
    <div
      className="text-success/50 mt-8 flex w-full items-center justify-center gap-2 text-xs font-medium tracking-widest uppercase"
      aria-hidden="true"
      data-testid="encrypted-badge"
    >
      <span className="bg-success/20 h-px w-8" />
      <span>{label}</span>
      <span className="bg-success/20 h-px w-8" />
    </div>
  );
}

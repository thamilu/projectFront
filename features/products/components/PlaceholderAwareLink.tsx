import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Wraps a merchandising card in a link **only when it points at real content**.
 *
 * [BUG THIS FIXES] Homepage sections pad short result sets with static
 * placeholders (see `padWithDemoData` and `constants/placeholders.ts`). Those
 * placeholders carry ids `1`–`6`, chosen as plain sequential numbers — which
 * collide with real product and category ids in the database.
 *
 * Each padded card was still rendered inside a `<Link href={/products/${id}}>`,
 * so clicking one navigated to whatever real record happened to own that id.
 * Verified against a running backend: the four flash-deal placeholders
 * advertise "Smartphone ₹89,900", "Running Shoes ₹13,900", "Wireless
 * Headphones ₹29,900" and "Laptop ₹1,09,900" — and **all four** resolved to the
 * same unrelated product, "Nike Air Max" at ₹120.
 *
 * A shopper clicking an advertised price and landing on a different product at
 * a different price is a bait-and-switch, however unintentional. It is also not
 * an outage symptom: padding runs whenever the catalogue holds fewer items than
 * a section's minimum, which is normal operation for a new store.
 *
 * `padWithDemoData` does guard against collisions, but only against ids in the
 * *same fetched page* — it cannot know about records elsewhere in the
 * catalogue. Rather than trying to mint globally-unique placeholder ids, this
 * removes the navigation entirely: a placeholder has no destination, so it
 * should not behave like it does.
 *
 * The card still renders, still carries its `PreviewBadge`, and is simply inert.
 *
 * @module features/products/components/PlaceholderAwareLink
 */

interface PlaceholderAwareLinkProps {
  /** True when this card is static placeholder content, not a real record. */
  isPlaceholder?: boolean;
  /** Destination for real content. Ignored when `isPlaceholder` is true. */
  href: string;
  className?: string;
  children: ReactNode;
}

export function PlaceholderAwareLink({
  isPlaceholder,
  href,
  className,
  children,
}: PlaceholderAwareLinkProps) {
  if (isPlaceholder) {
    return (
      <div
        className={className}
        /*
         * `aria-disabled` rather than removing it from the accessibility tree:
         * the card's content is still meaningful to read. It is simply not
         * actionable, and must not appear in the tab order — a keyboard user
         * tabbing onto something that does nothing is its own defect.
         */
        aria-disabled="true"
        data-placeholder="true"
      >
        {children}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

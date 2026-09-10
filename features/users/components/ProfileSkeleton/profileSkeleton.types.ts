/**
 * Controls which skeleton layout variant to render.
 * - 'full'     → Full page profile skeleton with avatar, tabs, card body.
 * - 'compact'  → Single card placeholder for embedded sections.
 * - 'personal' → Personal details tab: repeated field-group cards.
 * - 'address'  → Address tab: a single field-group card.
 */
export type SkeletonVariant = 'full' | 'compact' | 'personal' | 'address';

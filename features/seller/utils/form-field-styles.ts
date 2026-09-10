import { cn } from '@/shared/utils';

export const FIELD_STATE_CLASSES = {
  editable: 'bg-background/50',
  locked: 'bg-muted/30 border-none shadow-inner cursor-not-allowed',
} as const;

/**
 * Returns Tailwind classes for form field based on edit state.
 *
 * @param isEditing - Whether the field is in edit mode
 * @returns Tailwind class string
 */
export function getFieldStateClass(isEditing: boolean): string {
  return cn(isEditing ? FIELD_STATE_CLASSES.editable : FIELD_STATE_CLASSES.locked);
}

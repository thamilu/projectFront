'use client';

import { useState, useEffect, useCallback } from 'react';

interface EditStateReturn {
  readonly isEditing: boolean;
  readonly handleEdit: () => void;
  readonly handleCancel: () => void;
  readonly handleReset: () => void;
  readonly closeEdit: () => void;
}

/**
 * [SRP] Owns editing lifecycle and unsaved-changes browser guard.
 * ProfileForm delegates this entirely — it does not know HOW editing works.
 *
 * Guard is conditional — addEventListener only called when needed.
 * This avoids attaching/detaching on every render.
 */
export function useEditState(isDirty: boolean, reset: () => void): EditStateReturn {
  const [isEditing, setIsEditing] = useState(false);

  // [PERF] Effect only runs when guard is actually needed
  // No listener attached for clean/non-editing state
  useEffect(() => {
    if (!isDirty || !isEditing) return;

    const guard = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
      // Required for cross-browser compatibility. Cast to avoid the TypeScript returnValue deprecation warning.
      (e as Omit<BeforeUnloadEvent, 'returnValue'> & { returnValue: string }).returnValue = '';
    };

    // In-app internal link navigation guard for Next.js App Router
    const handleAnchorClick = (e: MouseEvent): void => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || target.target === '_blank') return;

      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', guard);
    document.addEventListener('click', handleAnchorClick, true);

    return () => {
      window.removeEventListener('beforeunload', guard);
      document.removeEventListener('click', handleAnchorClick, true);
    };
  }, [isDirty, isEditing]);

  const handleEdit = useCallback((): void => setIsEditing(true), []);

  const handleCancel = useCallback((): void => {
    reset();
    setIsEditing(false);
  }, [reset]);

  // [DRY] handleReset only resets form — does NOT exit edit mode
  // This is intentionally different from handleCancel
  const handleReset = useCallback((): void => reset(), [reset]);

  // [HARDEN] Separate from handleCancel — does NOT reset form values
  // Used by submit success path: close edit mode but keep submitted values
  const closeEdit = useCallback((): void => setIsEditing(false), []);

  return {
    isEditing,
    handleEdit,
    handleCancel,
    handleReset,
    closeEdit,
  } as const;
}

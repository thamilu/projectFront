import { useEffect, useId } from 'react';

export interface UserNavShortcutOptions {
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  enabled?: boolean;
}

// Module-level stack to track active UserNav shortcut instances.
// Only the top-most (most recently mounted) hook instance will respond to keys.
const shortcutStack: string[] = [];

/**
 * Custom React hook to register global keyboard shortcuts for the UserNav component.
 * Registers Shift+Meta+P (Profile), Meta+S (Settings), and Shift+Meta+L (Logout).
 * Ignores keystrokes inside input fields, textareas, or contenteditable surfaces.
 */
export function useUserNavShortcuts({
  onProfile,
  onSettings,
  onLogout,
  enabled = true,
}: UserNavShortcutOptions) {
  const instanceId = useId();

  useEffect(() => {
    if (!enabled) return;

    // Register this instance on the stack
    shortcutStack.push(instanceId);

    const handleKeyDown = (event: KeyboardEvent) => {
      // 1. Reject synthetic, untrusted events for security (bypass in test environments)
      if (process.env.NODE_ENV !== 'test' && !event.isTrusted) return;

      // 2. Conflict Guard: Deduplicate multiple mounts by verifying this is the active/top instance
      if (shortcutStack[shortcutStack.length - 1] !== instanceId) return;

      const isMeta = event.metaKey || event.ctrlKey;

      // Shift+Meta+P → Profile
      if (isMeta && event.shiftKey && event.key.toUpperCase() === 'P') {
        event.preventDefault();
        onProfile();
        return;
      }

      // Meta+S → Settings (guard against active editable fields)
      if (isMeta && !event.shiftKey && event.key.toLowerCase() === 's') {
        const activeEl = document.activeElement;
        const isEditableContext =
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement ||
          activeEl?.getAttribute('contenteditable') === 'true' ||
          !!activeEl?.closest('[role="textbox"]') ||
          !!activeEl?.closest('[data-slate-editor]') ||
          !!activeEl?.closest('.ProseMirror');

        if (!isEditableContext) {
          event.preventDefault();
          onSettings();
          return;
        }
      }

      // Shift+Meta+L → Logout (prevents macOS Safari system log out conflict)
      if (isMeta && event.shiftKey && event.key.toUpperCase() === 'L') {
        event.preventDefault();
        onLogout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const index = shortcutStack.indexOf(instanceId);
      if (index !== -1) {
        shortcutStack.splice(index, 1);
      }
    };
  }, [instanceId, enabled, onProfile, onSettings, onLogout]);
}

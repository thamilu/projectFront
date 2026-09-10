'use client';

import React, { useRef, useCallback } from 'react';
import { addDays, subDays, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth } from 'date-fns';

interface UseCalendarKeyboardProps {
  days: Date[];
  onSelect: (date: Date) => void;
  onNavigateDate?: (date: Date) => void;
  onClose?: () => void;
}

/**
 * WAI-ARIA 1.2 Compliant Calendar Grid Keyboard Navigation Hook.
 * Supports complete directional, page, and modifier key navigation with roving focus.
 */
export function useCalendarKeyboard({
  days,
  onSelect,
  onNavigateDate,
  onClose,
}: UseCalendarKeyboardProps) {
  const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, currentDay: Date, idx: number) => {
      const focusIndex = (targetIdx: number) => {
        if (targetIdx >= 0 && targetIdx < days.length) {
          e.preventDefault();
          dayRefs.current[targetIdx]?.focus();
        }
      };

      const jumpToDate = (targetDate: Date) => {
        e.preventDefault();
        onNavigateDate?.(targetDate);
      };

      switch (e.key) {
        case 'ArrowRight':
          if (idx + 1 < days.length) {
            focusIndex(idx + 1);
          } else {
            jumpToDate(addDays(currentDay, 1));
          }
          break;

        case 'ArrowLeft':
          if (idx - 1 >= 0) {
            focusIndex(idx - 1);
          } else {
            jumpToDate(subDays(currentDay, 1));
          }
          break;

        case 'ArrowDown':
          if (idx + 7 < days.length) {
            focusIndex(idx + 7);
          } else {
            jumpToDate(addDays(currentDay, 7));
          }
          break;

        case 'ArrowUp':
          if (idx - 7 >= 0) {
            focusIndex(idx - 7);
          } else {
            jumpToDate(subDays(currentDay, 7));
          }
          break;

        case 'PageUp':
          if (e.shiftKey) {
            jumpToDate(subYears(currentDay, 1));
          } else {
            jumpToDate(subMonths(currentDay, 1));
          }
          break;

        case 'PageDown':
          if (e.shiftKey) {
            jumpToDate(addYears(currentDay, 1));
          } else {
            jumpToDate(addMonths(currentDay, 1));
          }
          break;

        case 'Home':
          e.preventDefault();
          if (e.ctrlKey) {
            jumpToDate(startOfMonth(currentDay));
          } else {
            focusIndex(idx - (idx % 7)); // First day of current week row
          }
          break;

        case 'End':
          e.preventDefault();
          if (e.ctrlKey) {
            jumpToDate(endOfMonth(currentDay));
          } else {
            focusIndex(idx - (idx % 7) + 6); // Last day of current week row
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(currentDay);
          break;

        default:
          break;
      }
    },
    [days, onSelect, onNavigateDate, onClose]
  );

  const registerRef = useCallback((idx: number, el: HTMLButtonElement | null) => {
    dayRefs.current[idx] = el;
  }, []);

  return {
    handleKeyDown,
    registerRef,
  };
}

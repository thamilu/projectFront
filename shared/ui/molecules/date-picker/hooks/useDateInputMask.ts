'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ISODate } from '../types/date-picker.types';
import type { DobValidationResult } from '../types/dob-picker.types';
import { normalizeDateInput, formatMaskedDigits, extractDigits } from '../utils/date-mask';
import { formatISODateToDisplay } from '../utils/date-format';
import { validateDob } from '../utils/date-validation';

interface UseDateInputMaskOptions {
  value?: ISODate | null;
  onChange: (date: ISODate | null) => void;
  onAgeChange?: (result: DobValidationResult) => void;
  minAge?: number;
  maxAge?: number;
  maxDate?: Date | null;
  inputFormat?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function useDateInputMask({
  value,
  onChange,
  onAgeChange,
  minAge,
  maxAge,
  maxDate,
  disabled,
  readOnly,
}: UseDateInputMaskOptions) {
  // Derive initial display text from initial value
  const [displayText, setDisplayText] = useState<string>(() => {
    if (!value) return '';
    return formatISODateToDisplay(value, 'dd/MM/yyyy');
  });

  const [validationResult, setValidationResult] = useState<DobValidationResult>(() => {
    if (!value) return { valid: false };
    return validateDob(value, minAge, maxAge, maxDate);
  });

  // Track if user is actively typing to avoid overwriting typed characters
  const isTypingRef = useRef(false);

  // Sync internal display text when external value changes from calendar or form reset
  useEffect(() => {
    if (isTypingRef.current) return;

    if (!value) {
      setDisplayText('');
      const emptyResult: DobValidationResult = { valid: false };
      setValidationResult(emptyResult);
      onAgeChange?.(emptyResult);
      return;
    }

    const formatted = formatISODateToDisplay(value, 'dd/MM/yyyy');
    setDisplayText(formatted);
    const result = validateDob(value, minAge, maxAge, maxDate);
    setValidationResult(result);
    onAgeChange?.(result);
  }, [value, minAge, maxAge, maxDate, onAgeChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      isTypingRef.current = true;

      const raw = e.target.value;

      // When input is cleared
      if (!raw) {
        setDisplayText('');
        const emptyResult: DobValidationResult = { valid: false };
        setValidationResult(emptyResult);
        onChange(null);
        onAgeChange?.(emptyResult);
        isTypingRef.current = false;
        return;
      }

      // Auto-format digits with slashes
      const digits = extractDigits(raw);
      const { formatted, isComplete } = formatMaskedDigits(digits, '/');
      setDisplayText(formatted);

      if (isComplete) {
        const normalized = normalizeDateInput(formatted, '/');
        if (normalized.iso) {
          const result = validateDob(normalized.iso, minAge, maxAge, maxDate);
          setValidationResult(result);
          onAgeChange?.(result);
          if (result.valid) {
            onChange(normalized.iso);
          } else {
            onChange(null);
          }
        } else {
          const invalidResult: DobValidationResult = { valid: false, error: 'Invalid calendar date' };
          setValidationResult(invalidResult);
          onAgeChange?.(invalidResult);
          onChange(null);
        }
      } else {
        // Incomplete date
        const partialResult: DobValidationResult = { valid: false };
        setValidationResult(partialResult);
        onAgeChange?.(partialResult);
        onChange(null);
      }

      // Reset typing flag after update
      setTimeout(() => {
        isTypingRef.current = false;
      }, 50);
    },
    [disabled, readOnly, onChange, onAgeChange, minAge, maxAge, maxDate]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const normalized = normalizeDateInput(pasted, '/');

      setDisplayText(normalized.display);

      if (normalized.iso) {
        const result = validateDob(normalized.iso, minAge, maxAge, maxDate);
        setValidationResult(result);
        onAgeChange?.(result);
        if (result.valid) {
          onChange(normalized.iso);
        } else {
          onChange(null);
        }
      } else {
        const invalidResult: DobValidationResult = { valid: false, error: 'Invalid pasted date' };
        setValidationResult(invalidResult);
        onAgeChange?.(invalidResult);
        onChange(null);
      }
    },
    [disabled, readOnly, onChange, onAgeChange, minAge, maxAge, maxDate]
  );

  const handleClearInput = useCallback(() => {
    setDisplayText('');
    const emptyResult: DobValidationResult = { valid: false };
    setValidationResult(emptyResult);
    onChange(null);
    onAgeChange?.(emptyResult);
  }, [onChange, onAgeChange]);

  return {
    displayText,
    setDisplayText,
    validationResult,
    handleInputChange,
    handlePaste,
    handleClearInput,
  };
}

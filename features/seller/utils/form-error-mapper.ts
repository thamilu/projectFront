import type { UseFormSetError, Path, FieldValues } from 'react-hook-form';

export interface FieldError {
  field: string;
  message: string;
}

export type ApiFieldErrors = FieldError[] | Record<string, string | string[]>;

export function mapApiErrorsToForm<T extends FieldValues>(
  fieldErrors: ApiFieldErrors,
  setError: UseFormSetError<T>
): void {
  if (Array.isArray(fieldErrors)) {
    fieldErrors.forEach(({ field, message }) => {
      if (field) {
        setError(field as Path<T>, { type: 'server', message: message ?? 'Invalid value' });
      }
    });
    return;
  }

  Object.entries(fieldErrors).forEach(([field, messages]) => {
    const message = Array.isArray(messages) ? messages[0] : (messages as string);
    setError(field as Path<T>, { type: 'server', message });
  });
}

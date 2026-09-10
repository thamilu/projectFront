import type { Locale } from 'date-fns';
import type { ISODate, DatePickerSize, DatePickerVariant } from './date-picker.types';

/**
 * Result returned by DOB age validation evaluation
 */
export interface DobValidationResult {
  /** Whether the date satisfies all constraints (format, valid date, min/max age, maxDate) */
  valid: boolean;
  /** Exact computed age in full elapsed solar years */
  age?: number;
  /** User-friendly error message if validation fails */
  error?: string;
}

/**
 * Configuration options for DOB age verification rules
 */
export interface DobAgeConfig {
  /** Minimum required age in whole years (e.g. 18 for adult onboarding) */
  minAge?: number;
  /** Maximum valid age in whole years (e.g. 120) */
  maxAge?: number;
  /** Custom reference date for age calculation (defaults to today) */
  referenceDate?: ISODate | Date;
}

/**
 * Props for DateOfBirthPicker component
 */
export interface DateOfBirthPickerProps extends React.AriaAttributes {
  /** Optional HTML id for DOM binding and accessibility label reference */
  id?: string;

  /** Form field name attribute */
  name?: string;

  /** Canonical value in ISO-8601 date format ('YYYY-MM-DD') or null */
  value?: ISODate | null;

  /** Callback fired when a valid date is committed or cleared */
  onChange: (date: ISODate | null) => void;

  /** Callback fired with validation and calculated age metadata */
  onAgeChange?: (result: DobValidationResult) => void;

  /** Placeholder text displayed inside empty input (default: 'DD / MM / YYYY') */
  placeholder?: string;

  /** Input display mask format (default: 'dd/MM/yyyy') */
  inputFormat?: string;

  /** Disables trigger and all calendar interactions */
  disabled?: boolean;

  /** Read-only mode — viewable but non-editable */
  readOnly?: boolean;

  /** Required field flag */
  required?: boolean;

  /** Validation error message or boolean state */
  error?: boolean | string;

  /** Additional CSS class for outer input wrapper */
  className?: string;

  /** Additional CSS class for popover panel */
  popoverClassName?: string;

  /** Minimum selectable age (e.g. 18 years old) */
  minAge?: number;

  /** Maximum selectable age (e.g. 120 years old) */
  maxAge?: number;

  /** Minimum absolute date allowed (defaults to today - maxAge or 1900-01-01) */
  minDate?: Date | null;

  /** Maximum absolute date allowed (defaults to today; future dates prohibited) */
  maxDate?: Date | null;

  /** Whether to show the real-time calculated age indicator badge (default: true) */
  showAgeBadge?: boolean;

  /** Custom badge formatter for age display (e.g. (age) => `✓ Age: ${age} years`) */
  formatAgeBadge?: (age: number) => string;

  /** Whether an inline clear button is available when a date is selected (default: true) */
  clearable?: boolean;

  /** Date-fns locale object for localization */
  locale?: Locale;

  /** Week starts on (0 = Sunday, 1 = Monday; default: 1) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /** Component size variant */
  size?: DatePickerSize;

  /** Visual variant */
  variant?: DatePickerVariant;

  /** Auto-focus input on initial mount */
  autoFocus?: boolean;

  /** Custom tab index */
  tabIndex?: number;

  /** Callback when cleared */
  onClear?: () => void;

  /** Focus event handler */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;

  /** Blur event handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

import type { Locale } from 'date-fns';
import type { ISODate, DatePickerSize, DatePickerVariant } from './date-picker.types';

/**
 * Specific time-window slot for a given delivery date
 */
export interface DeliveryTimeSlot {
  /** Unique time slot identifier (e.g. 'morning', 'afternoon', 'evening', 'express') */
  id: string;
  /** Primary label (e.g. 'Morning', 'Afternoon', 'Evening') */
  name: string;
  /** Human-readable time window (e.g. '9 AM–12 PM', '12–4 PM', '4–8 PM') */
  timeRange: string;
  /** Surcharge or base delivery fee for this time window (0 = free) */
  price: number;
  /** Currency symbol (default: '₹') */
  currencySymbol?: string;
  /** Optional badge label (e.g. 'FREE', 'FASTEST', 'POPULAR') */
  badge?: string;
  /** Whether this specific time slot is disabled or full */
  disabled?: boolean;
}

/**
 * Backend-driven availability and pricing metadata for a specific calendar date
 */
export interface DeliveryAvailability {
  /** Canonical ISO-8601 calendar date ('YYYY-MM-DD') */
  date: ISODate;
  /** Business timezone for cutoff evaluation (e.g. 'Asia/Kolkata') */
  timezone?: string;
  /** Whether delivery is possible on this date */
  available: boolean;
  /** Base delivery price for this day in major currency units (e.g. 0 for Free, 40 for ₹40) */
  price: number;
  /** Currency symbol (default: '₹') */
  currencySymbol?: string;
  /** Promotional or status badge ('FREE' | 'FASTEST' | 'STANDARD' | 'SURGE') */
  badge?: string;
  /** Cutoff time string (e.g. '14:00' or ISO timestamp) after which same-day is unavailable */
  cutoffTime?: string;
  /** Available time windows on this date */
  slots?: DeliveryTimeSlot[];
  /** Reason when date is unavailable (e.g. 'Holiday', 'Warehouse Blackout', 'Capacity Full') */
  reason?: string;
}

/**
 * Final confirmed delivery selection contract
 */
export interface DeliverySelection {
  /** Selected delivery date in ISO-8601 format ('YYYY-MM-DD') */
  date: ISODate;
  /** Selected time window identifier if applicable */
  timeSlotId?: string;
  /** Selected time window label if applicable (e.g. 'Morning (9 AM–12 PM)') */
  timeSlotLabel?: string;
  /** Total computed delivery price */
  price: number;
  /** Currency symbol (default: '₹') */
  currencySymbol: string;
  /** Whether the delivery is free (price === 0) */
  isFree: boolean;
  /** Human-friendly formatted summary (e.g. 'Thursday, Aug 20 • Free Delivery') */
  estimatedDelivery: string;
}

/**
 * Props for DeliveryDatePicker component
 */
export interface DeliveryDatePickerProps extends React.AriaAttributes {
  /** Optional HTML id */
  id?: string;

  /** Form field name attribute */
  name?: string;

  /** Currently selected delivery date (ISO 'YYYY-MM-DD') */
  value?: ISODate | null;

  /** Currently selected time slot id (optional) */
  selectedTimeSlotId?: string | null;

  /** Callback fired when a delivery date/slot is selected */
  onChange: (date: ISODate | null, selection?: DeliverySelection | null) => void;

  /** Callback fired when full confirmation is submitted via Confirm CTA */
  onConfirm?: (selection: DeliverySelection) => void;

  /** Backend availability schedule for upcoming days */
  availability?: DeliveryAvailability[];

  /** Currency symbol (default: '₹') */
  currencySymbol?: string;

  /** Number of days to display in the quick horizontal slot strip (default: 4) */
  quickStripDays?: number;

  /** Whether to show the quick horizontal date strip above the calendar (default: true) */
  showQuickStrip?: boolean;

  /** Whether to show time-slot selection cards (default: true) */
  showTimeSlots?: boolean;

  /** Whether to show the selected delivery confirmation CTA card (default: true) */
  showConfirmButton?: boolean;

  /** Custom label for confirmation CTA (default: 'Confirm Delivery') */
  confirmButtonLabel?: string;

  /** Earliest selectable delivery date (defaults to today) */
  minDate?: Date | null;

  /** Latest selectable delivery date (defaults to 60 days ahead) */
  maxDate?: Date | null;

  /** Custom predicate for disabling blackout or holiday dates */
  isDateDisabled?: (date: Date) => boolean;

  /** Disables the entire delivery picker */
  disabled?: boolean;

  /** Required field flag */
  required?: boolean;

  /** Validation error message */
  error?: boolean | string;

  /** Outer wrapper CSS class */
  className?: string;

  /** Popover panel CSS class */
  popoverClassName?: string;

  /** Date-fns locale object for localization */
  locale?: Locale;

  /** Week starts on (0 = Sunday, 1 = Monday; default: 1) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /** Size variant */
  size?: DatePickerSize;

  /** Visual variant */
  variant?: DatePickerVariant;
}

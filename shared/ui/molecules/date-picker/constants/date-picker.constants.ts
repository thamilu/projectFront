/**
 * Enterprise DatePicker Architecture Constants
 * Design System: Enterprise v3 (Compact Enterprise Token Architecture)
 */

import type { DeliveryTimeSlot } from '../types/delivery-picker.types';

// ─── Default DOB & Calendar Offsets ──────────────────────────────────────────
export const DEFAULT_YEAR_PAST = 100;
export const DEFAULT_YEAR_FUTURE = 20;
export const DEFAULT_MIN_AGE = 0;
export const DEFAULT_MAX_AGE = 120;
export const DEFAULT_SELLER_MIN_AGE = 18;

// ─── Virtualizer & Year Panel Dimensions (Legacy & Virtualized drawer support) ─
export const YEAR_BUTTON_HEIGHT = 40;
export const MONTH_GRID_HEIGHT = 120;
export const BASE_ITEM_HEIGHT = 40;
export const EXPANDED_ITEM_HEIGHT = 160;
export const YEAR_PANEL_HEIGHT = 320;
export const YEAR_LABEL_HEIGHT = 36;
export const VIRTUALIZER_OVERSCAN = 3;

// ─── Default Date Formats ────────────────────────────────────────────────────
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const DEFAULT_DISPLAY_FORMAT = 'PP'; // "Aug 19, 2026"
export const DOB_DEFAULT_INPUT_FORMAT = 'dd/MM/yyyy'; // Direct India / European standard format
export const DEFAULT_WEEK_STARTS_ON = 0; // 0 = Sunday

// ─── Month Definitions ────────────────────────────────────────────────────────
export const MONTHS = [
  { index: 0, abbr: 'Jan', full: 'January' },
  { index: 1, abbr: 'Feb', full: 'February' },
  { index: 2, abbr: 'Mar', full: 'March' },
  { index: 3, abbr: 'Apr', full: 'April' },
  { index: 4, abbr: 'May', full: 'May' },
  { index: 5, abbr: 'Jun', full: 'June' },
  { index: 6, abbr: 'Jul', full: 'July' },
  { index: 7, abbr: 'Aug', full: 'August' },
  { index: 8, abbr: 'Sep', full: 'September' },
  { index: 9, abbr: 'Oct', full: 'October' },
  { index: 10, abbr: 'Nov', full: 'November' },
  { index: 11, abbr: 'Dec', full: 'December' },
] as const;

export type MonthDefinition = (typeof MONTHS)[number];

// ─── Week Day Header Labels (Subdued, Accessible) ─────────────────────────────
export const WEEK_DAYS_SUNDAY_FIRST = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
export const WEEK_DAYS_MONDAY_FIRST = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
export const WEEK_DAYS = WEEK_DAYS_SUNDAY_FIRST;

// ─── Delivery Default Constants ───────────────────────────────────────────────
export const DELIVERY_DEFAULT_QUICK_STRIP_DAYS = 4;
export const DEFAULT_CURRENCY_SYMBOL = '₹';

export const DEFAULT_DELIVERY_TIME_SLOTS: DeliveryTimeSlot[] = [
  {
    id: 'morning',
    name: 'Morning',
    timeRange: '9 AM–12 PM',
    price: 0,
    badge: 'FREE',
    currencySymbol: '₹',
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    timeRange: '12–4 PM',
    price: 40,
    badge: 'STANDARD',
    currencySymbol: '₹',
  },
  {
    id: 'evening',
    name: 'Evening',
    timeRange: '4–8 PM',
    price: 40,
    badge: 'POPULAR',
    currencySymbol: '₹',
  },
];

// ─── Design System Semantic Class Tokens ──────────────────────────────────────
// Compact ~312px popover width with 12px padding and solid dark/light background
export const POP_CONTENT_CLASSES =
  'w-[312px] p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 z-50 focus:outline-none';

// 36px date cell
export const DAY_BASE_CLASSES =
  'h-9 w-9 flex items-center justify-center rounded-lg text-xs font-medium transition-all relative select-none text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1';

export const DAY_OUTSIDE_MONTH_CLASSES = 'text-muted-foreground/30 hover:text-muted-foreground/60';

export const DAY_HOVER_CLASSES = 'hover:bg-muted active:scale-95 transition-all duration-100';

// Filled primary background for explicitly selected date
export const DAY_SELECTED_CLASSES =
  'bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/95';

// Subtle ring for today's date (non-filled, clearly distinguished from selected)
export const DAY_TODAY_CLASSES = 'ring-1 ring-inset ring-primary/60 text-primary font-semibold bg-primary/5';

// Disabled dates: muted opacity without strikethrough (clean enterprise style)
export const DAY_DISABLED_CLASSES =
  'opacity-30 cursor-not-allowed pointer-events-none text-muted-foreground select-none';

// Legacy compatibility
export const DATE_FORMAT = DEFAULT_DATE_FORMAT;
export const DISPLAY_FORMAT = DEFAULT_DISPLAY_FORMAT;
export const YEAR_RANGE_PAST = DEFAULT_YEAR_PAST;
export const YEAR_RANGE_FUTURE = DEFAULT_YEAR_FUTURE;

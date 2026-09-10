import { format, isSameDay, addDays, startOfDay } from 'date-fns';
import type { ISODate } from '../types/date-picker.types';
import type { DeliveryAvailability, DeliverySelection, DeliveryTimeSlot } from '../types/delivery-picker.types';
import { buildISODate, parseISODateParts } from './date-format';
import { DEFAULT_CURRENCY_SYMBOL, DEFAULT_DELIVERY_TIME_SLOTS } from '../constants/date-picker.constants';

/**
 * Formats a delivery slot price into a human-friendly string (e.g. 0 -> 'FREE', 40 -> '₹40')
 */
export function formatSlotPrice(price: number, currencySymbol: string = DEFAULT_CURRENCY_SYMBOL): string {
  if (price === 0) return 'FREE';
  return `${currencySymbol}${price}`;
}

/**
 * Returns a relative day badge tag ('Today', 'Tomorrow', or null) for a date
 */
export function getRelativeDayLabel(
  date: ISODate | Date,
  referenceDate: Date = new Date()
): 'Today' | 'Tomorrow' | null {
  let targetDate: Date;
  if (date instanceof Date) {
    targetDate = date;
  } else {
    const parts = parseISODateParts(date);
    if (!parts) return null;
    targetDate = new Date(parts.year, parts.month - 1, parts.day);
  }

  const ref = startOfDay(referenceDate);
  const target = startOfDay(targetDate);

  if (isSameDay(target, ref)) return 'Today';
  if (isSameDay(target, addDays(ref, 1))) return 'Tomorrow';
  return null;
}

/**
 * Finds the matching availability entry for a given date from the backend availability list
 */
export function findDeliveryAvailability(
  targetDate: ISODate | Date,
  availability?: DeliveryAvailability[]
): DeliveryAvailability | null {
  if (!availability || availability.length === 0) return null;

  let isoStr: string;
  if (targetDate instanceof Date) {
    isoStr = buildISODate(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate());
  } else {
    isoStr = targetDate;
  }

  return availability.find((a) => a.date === isoStr) ?? null;
}

/**
 * Generates an enterprise default delivery schedule for the next N days.
 * Used for offline mode, testing, and initial mock states before checkout API returns.
 */
export function createDefaultDeliverySchedule(
  daysAhead: number = 14,
  currencySymbol: string = DEFAULT_CURRENCY_SYMBOL
): DeliveryAvailability[] {
  const schedule: DeliveryAvailability[] = [];
  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const d = addDays(today, i);
    const iso = buildISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const isWeekend = d.getDay() === 0; // Sunday

    // Today is free, tomorrow is free, weekdays ₹0-40, Sunday blackout or paid
    let price = 0;
    let badge = 'FREE';
    let available = true;
    let reason: string | undefined;

    if (i === 0) {
      price = 0;
      badge = 'FASTEST';
    } else if (i === 1) {
      price = 0;
      badge = 'FREE';
    } else if (isWeekend) {
      price = 40;
      badge = 'WEEKEND';
    } else {
      price = i % 2 === 0 ? 0 : 40;
      badge = price === 0 ? 'FREE' : 'STANDARD';
    }

    schedule.push({
      date: iso,
      available,
      price,
      currencySymbol,
      badge,
      reason,
      slots: DEFAULT_DELIVERY_TIME_SLOTS.map((s) => ({
        ...s,
        currencySymbol,
        price: s.price === 0 && price > 0 ? price : s.price,
      })),
    });
  }

  return schedule;
}

/**
 * Formats a clean summary string for the delivery selection
 */
export function buildDeliverySummary(
  dateISO: ISODate,
  timeSlot?: DeliveryTimeSlot | null,
  currencySymbol: string = DEFAULT_CURRENCY_SYMBOL,
  dayBasePrice?: number
): DeliverySelection {
  const parts = parseISODateParts(dateISO);
  const dateObj = parts ? new Date(parts.year, parts.month - 1, parts.day) : new Date();

  const formattedDate = format(dateObj, 'EEEE, MMM d');
  const relTag = getRelativeDayLabel(dateISO);
  const slotPrice = timeSlot ? timeSlot.price : 0;
  const basePrice = dayBasePrice ?? 0;
  const effectivePrice = Math.max(slotPrice, basePrice);
  const isFree = effectivePrice === 0;

  const priceText = isFree ? 'Free Delivery' : `${currencySymbol}${effectivePrice} Delivery`;
  const slotText = timeSlot ? ` (${timeSlot.name} ${timeSlot.timeRange})` : '';
  const datePrefix = relTag ? `${relTag}, ${format(dateObj, 'MMM d')}` : formattedDate;

  const estimatedDelivery = `${datePrefix}${slotText} • ${priceText}`;

  return {
    date: dateISO,
    timeSlotId: timeSlot?.id,
    timeSlotLabel: timeSlot ? `${timeSlot.name} (${timeSlot.timeRange})` : undefined,
    price: effectivePrice,
    currencySymbol,
    isFree,
    estimatedDelivery,
  };
}

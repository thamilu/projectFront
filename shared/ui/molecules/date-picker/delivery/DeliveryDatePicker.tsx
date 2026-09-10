'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar as CalendarIcon, Truck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/atoms/popover';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';
import { DatePickerCalendar } from '../DatePickerCalendar';
import { DeliverySlotStrip } from './DeliverySlotStrip';
import { DeliveryTimeSlots } from './DeliveryTimeSlots';
import { DeliverySummary } from './DeliverySummary';
import { parseISODateParts, buildISODate } from '../utils/date-format';
import {
  createDefaultDeliverySchedule,
  findDeliveryAvailability,
  buildDeliverySummary,
  formatSlotPrice,
} from '../utils/delivery-slot.utils';
import { POP_CONTENT_CLASSES, DEFAULT_CURRENCY_SYMBOL } from '../constants/date-picker.constants';
import type { DeliveryDatePickerProps, DeliveryTimeSlot, DeliverySelection } from '../types/delivery-picker.types';
import type { DayRenderInfo, ISODate } from '../types/date-picker.types';

export function DeliveryDatePicker({
  id,
  // Accepted for API-shape parity with DateOfBirthPickerProps, but this
  // variant has no native <input> to forward them to (it's Popover/Button
  // driven) — kept in the type for a consistent public contract across the
  // date-picker family, prefixed here since this implementation doesn't use them.
  name: _name,
  value,
  selectedTimeSlotId,
  onChange,
  onConfirm,
  availability: customAvailability,
  currencySymbol = DEFAULT_CURRENCY_SYMBOL,
  quickStripDays = 4,
  showQuickStrip = true,
  showTimeSlots = true,
  showConfirmButton = true,
  confirmButtonLabel = 'Confirm Delivery Date',
  minDate,
  maxDate,
  isDateDisabled,
  disabled = false,
  required: _required = false,
  error,
  className,
  popoverClassName,
  locale,
  weekStartsOn = 1,
  size: _size = 'default',
  variant: _variant = 'outline',
  ..._ariaProps
}: DeliveryDatePickerProps) {
  // Calendar popover open state
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Resolved availability schedule (falls back to mock if not passed)
  const availability = useMemo(() => {
    if (customAvailability && customAvailability.length > 0) {
      return customAvailability;
    }
    return createDefaultDeliverySchedule(30, currencySymbol);
  }, [customAvailability, currencySymbol]);

  // Selected date state (defaults to value or first available date)
  const selectedDateISO = useMemo<ISODate | null>(() => {
    if (value) return value;
    const firstAvailable = availability.find((a) => a.available);
    return firstAvailable ? firstAvailable.date : null;
  }, [value, availability]);

  // Active viewing date for month navigation in popover
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    if (selectedDateISO) {
      const parts = parseISODateParts(selectedDateISO);
      if (parts) return new Date(parts.year, parts.month - 1, parts.day);
    }
    return new Date();
  });

  // Selected Date object
  const selectedDateObj = useMemo<Date | null>(() => {
    if (!selectedDateISO) return null;
    const parts = parseISODateParts(selectedDateISO);
    return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
  }, [selectedDateISO]);

  // Find active availability entry for selected date
  const activeAvailability = useMemo(() => {
    if (!selectedDateISO) return null;
    return findDeliveryAvailability(selectedDateISO, availability);
  }, [selectedDateISO, availability]);

  // Active time slots for selected date
  const availableTimeSlots = useMemo<DeliveryTimeSlot[]>(() => {
    return activeAvailability?.slots ?? [];
  }, [activeAvailability]);

  // Selected time slot state
  const [activeTimeSlotId, setActiveTimeSlotId] = useState<string | null>(() => {
    if (selectedTimeSlotId) return selectedTimeSlotId;
    const firstEnabled = availableTimeSlots.find((s) => !s.disabled);
    return firstEnabled ? firstEnabled.id : null;
  });

  // Keep time slot synced when selected date or slots change
  useEffect(() => {
    if (selectedTimeSlotId) {
      setActiveTimeSlotId(selectedTimeSlotId);
      return;
    }
    const currentStillValid = availableTimeSlots.some((s) => s.id === activeTimeSlotId && !s.disabled);
    if (!currentStillValid) {
      const firstEnabled = availableTimeSlots.find((s) => !s.disabled);
      setActiveTimeSlotId(firstEnabled ? firstEnabled.id : null);
    }
  }, [availableTimeSlots, selectedTimeSlotId, activeTimeSlotId]);

  // Active time slot object
  const activeTimeSlot = useMemo(() => {
    return availableTimeSlots.find((s) => s.id === activeTimeSlotId) ?? null;
  }, [availableTimeSlots, activeTimeSlotId]);

  // Current DeliverySelection model
  const currentSelection = useMemo<DeliverySelection | null>(() => {
    if (!selectedDateISO) return null;
    return buildDeliverySummary(
      selectedDateISO,
      activeTimeSlot,
      currencySymbol,
      activeAvailability?.price
    );
  }, [selectedDateISO, activeTimeSlot, currencySymbol, activeAvailability]);

  // Handle date selection (from strip or calendar)
  const handleDateSelect = useCallback(
    (newDateISO: ISODate) => {
      const entry = findDeliveryAvailability(newDateISO, availability);
      if (!entry || !entry.available) return;

      const newSlot = entry.slots && entry.slots.length > 0 ? entry.slots[0] : null;
      const selection = buildDeliverySummary(newDateISO, newSlot, currencySymbol, entry.price);

      onChange(newDateISO, selection);

      const parts = parseISODateParts(newDateISO);
      if (parts) {
        setCurrentViewDate(new Date(parts.year, parts.month - 1, parts.day));
      }
      setCalendarOpen(false);
    },
    [availability, currencySymbol, onChange]
  );

  // Handle calendar day click
  const handleCalendarDayClick = useCallback(
    (date: Date) => {
      const iso = buildISODate(date.getFullYear(), date.getMonth() + 1, date.getDate());
      handleDateSelect(iso);
    },
    [handleDateSelect]
  );

  // Handle time slot selection
  const handleTimeSlotSelect = useCallback(
    (slot: DeliveryTimeSlot) => {
      setActiveTimeSlotId(slot.id);
      if (selectedDateISO) {
        const selection = buildDeliverySummary(
          selectedDateISO,
          slot,
          currencySymbol,
          activeAvailability?.price
        );
        onChange(selectedDateISO, selection);
      }
    },
    [selectedDateISO, currencySymbol, activeAvailability, onChange]
  );

  // Confirm CTA handler
  const handleConfirm = useCallback(() => {
    if (currentSelection) {
      onConfirm?.(currentSelection);
    }
  }, [currentSelection, onConfirm]);

  // Custom Day Cell Content Renderer: Day number + Price / Free Badge
  const renderDeliveryDayContent = useCallback(
    (date: Date, info: DayRenderInfo) => {
      const entry = findDeliveryAvailability(info.isoDate, availability);
      const isAvailable = entry ? entry.available : false;
      const isFree = entry?.price === 0;
      const priceText = entry ? formatSlotPrice(entry.price, entry.currencySymbol ?? currencySymbol) : '';

      return (
        <div className="flex flex-col items-center justify-center w-full h-full py-0.5 leading-none">
          <span className={cn('text-xs font-semibold', info.isSelected && 'text-primary-foreground font-bold')}>
            {info.dayNumber}
          </span>
          {info.isCurrentMonth && isAvailable && (
            <span
              className={cn(
                'text-[8px] font-bold mt-0.5 scale-90 tracking-tighter',
                info.isSelected
                  ? 'text-primary-foreground/90'
                  : isFree
                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'text-muted-foreground'
              )}
            >
              {priceText}
            </span>
          )}
          {info.isCurrentMonth && !isAvailable && (
            <span className="text-[9px] text-destructive font-bold mt-0.5">×</span>
          )}
        </div>
      );
    },
    [availability, currencySymbol]
  );

  // Custom Day Accessible Label
  const getDeliveryDayAriaLabel = useCallback(
    (date: Date, info: DayRenderInfo) => {
      const entry = findDeliveryAvailability(info.isoDate, availability);
      const status = entry?.available
        ? `${entry.price === 0 ? 'Free delivery' : `Delivery fee ${entry.price}`}`
        : 'Delivery unavailable';
      return `${info.isToday ? 'Today, ' : ''}${date.toLocaleDateString()} - ${status}`;
    },
    [availability]
  );

  // Check if date is disabled in calendar: past dates disabled by default, or blackout
  const checkIsDateDisabled = useCallback(
    (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Disable past dates
      if (date < today) return true;

      // Check custom predicate if supplied
      if (isDateDisabled && isDateDisabled(date)) return true;

      // Check backend availability
      const iso = buildISODate(date.getFullYear(), date.getMonth() + 1, date.getDate());
      const entry = findDeliveryAvailability(iso, availability);
      if (entry && !entry.available) return true;

      return false;
    },
    [availability, isDateDisabled]
  );

  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {/* ── Section Title & Trigger Button ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Delivery date</span>
        </div>

        {/* Popover trigger button for full calendar view */}
        <Popover open={calendarOpen} onOpenChange={(next) => !disabled && setCalendarOpen(next)}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              <span>{selectedDateISO ? 'Change date' : 'Select date'}</span>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={6}
            avoidCollisions={true}
            collisionPadding={16}
            className={cn(POP_CONTENT_CLASSES, popoverClassName)}
          >
            <div className="flex flex-col">
              <div className="mb-2 px-1 text-xs font-bold tracking-tight text-foreground">
                Delivery calendar
              </div>

              <DatePickerCalendar
                selectedDate={selectedDateObj}
                currentViewDate={currentViewDate}
                setCurrentViewDate={setCurrentViewDate}
                onSelect={handleCalendarDayClick}
                minDate={minDate ?? new Date()}
                maxDate={maxDate}
                isDateDisabled={checkIsDateDisabled}
                renderDayContent={renderDeliveryDayContent}
                getDayAriaLabel={getDeliveryDayAriaLabel}
                locale={locale}
                weekStartsOn={weekStartsOn}
              />

              {/* Legend for delivery prices */}
              <div className="mt-3 flex items-center justify-around border-t border-border/70 pt-2 text-[10px] text-muted-foreground font-semibold">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Paid</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-destructive font-bold">×</span>
                  <span>Unavailable</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── 1-Click Quick Slot Strip ──────────────────────────────────── */}
      {showQuickStrip && (
        <DeliverySlotStrip
          selectedDate={selectedDateISO}
          availability={availability}
          maxDays={quickStripDays}
          onSelectDate={handleDateSelect}
          onOpenCalendar={() => setCalendarOpen(true)}
          disabled={disabled}
        />
      )}

      {/* ── Time Slots Grid ───────────────────────────────────────────── */}
      {showTimeSlots && availableTimeSlots.length > 0 && (
        <DeliveryTimeSlots
          slots={availableTimeSlots}
          selectedSlotId={activeTimeSlotId}
          onSelectSlot={handleTimeSlotSelect}
          disabled={disabled}
        />
      )}

      {/* ── Delivery Selection Summary & Confirm CTA ──────────────────── */}
      {currentSelection && (
        <DeliverySummary
          selection={currentSelection}
          onConfirm={handleConfirm}
          buttonLabel={confirmButtonLabel}
          showButton={showConfirmButton}
          disabled={disabled}
        />
      )}

      {/* Inline Error feedback */}
      {hasError && (
        <p role="alert" className="text-xs font-semibold text-destructive pl-1 animate-in fade-in-50">
          {typeof error === 'string' ? error : 'Please select a valid delivery date'}
        </p>
      )}
    </div>
  );
}

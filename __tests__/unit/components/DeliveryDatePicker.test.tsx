import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryDatePicker } from '@/shared/ui/molecules/date-picker/delivery/DeliveryDatePicker';
import {
  createDefaultDeliverySchedule,
  findDeliveryAvailability,
  formatSlotPrice,
} from '@/shared/ui/molecules/date-picker/utils/delivery-slot.utils';
import type { DeliveryAvailability } from '@/shared/ui/molecules/date-picker/types/delivery-picker.types';

// Mock ResizeObserver, scrollTo, and scrollIntoView for JSDOM environment
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = MockResizeObserver;
  window.HTMLElement.prototype.scrollTo = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('DeliveryDatePicker Component — Enterprise Test Suite', () => {
  const mockSchedule: DeliveryAvailability[] = [
    {
      date: '2026-08-20',
      available: true,
      price: 0,
      badge: 'FASTEST',
      slots: [
        { id: 'morning', name: 'Morning', timeRange: '9 AM–12 PM', price: 0, badge: 'FREE' },
        { id: 'afternoon', name: 'Afternoon', timeRange: '12–4 PM', price: 40, badge: 'STANDARD' },
        { id: 'evening', name: 'Evening', timeRange: '4–8 PM', price: 40, badge: 'POPULAR' },
      ],
    },
    {
      date: '2026-08-21',
      available: true,
      price: 0,
      badge: 'FREE',
      slots: [
        { id: 'morning', name: 'Morning', timeRange: '9 AM–12 PM', price: 0, badge: 'FREE' },
        { id: 'afternoon', name: 'Afternoon', timeRange: '12–4 PM', price: 40, badge: 'STANDARD' },
      ],
    },
    {
      date: '2026-08-22',
      available: true,
      price: 40,
      badge: 'STANDARD',
      slots: [
        { id: 'morning', name: 'Morning', timeRange: '9 AM–12 PM', price: 40 },
        { id: 'evening', name: 'Evening', timeRange: '4–8 PM', price: 40 },
      ],
    },
    {
      date: '2026-08-23',
      available: false,
      price: 0,
      reason: 'Holiday',
    },
  ];

  describe('Quick Slot Strip & 1-Click Selection', () => {
    it('renders quick slot cards for upcoming delivery dates', () => {
      render(
        <DeliveryDatePicker
          value="2026-08-20"
          availability={mockSchedule}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Delivery date')).toBeInTheDocument();
      // Should show slot cards with day abbreviations
      expect(screen.getByRole('radio', { name: /Thu 20/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Fri 21/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Sat 22/i })).toBeInTheDocument();
    });

    it('selects date card on click and triggers onChange with DeliverySelection', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <DeliveryDatePicker
          value="2026-08-20"
          availability={mockSchedule}
          onChange={handleChange}
        />
      );

      const friCard = screen.getByRole('radio', { name: /Fri 21/i });
      await user.click(friCard);

      expect(handleChange).toHaveBeenCalledWith(
        '2026-08-21',
        expect.objectContaining({
          date: '2026-08-21',
          isFree: true,
        })
      );
    });

    it('disables unavailable dates in slot strip', () => {
      render(
        <DeliveryDatePicker
          value="2026-08-20"
          availability={mockSchedule}
          onChange={jest.fn()}
        />
      );

      const sunCard = screen.getByRole('radio', { name: /Sun 23/i });
      expect(sunCard).toBeDisabled();
    });
  });

  describe('Time Slots & Delivery Summary', () => {
    it('renders time slot selection options for the active date', () => {
      render(
        <DeliveryDatePicker
          value="2026-08-20"
          availability={mockSchedule}
          onChange={jest.fn()}
          showTimeSlots={true}
        />
      );

      expect(screen.getByText('Delivery time')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Morning/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Afternoon/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Evening/i })).toBeInTheDocument();
    });

    it('selecting a time slot updates selection price and summary', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <DeliveryDatePicker
          value="2026-08-20"
          availability={mockSchedule}
          onChange={handleChange}
        />
      );

      const afternoonSlot = screen.getByRole('radio', { name: /Afternoon/i });
      await user.click(afternoonSlot);

      expect(handleChange).toHaveBeenCalledWith(
        '2026-08-20',
        expect.objectContaining({
          timeSlotId: 'afternoon',
          price: 40,
          isFree: false,
        })
      );
    });

    it('renders delivery summary with price and calls onConfirm on CTA click', async () => {
      const user = userEvent.setup();
      const handleConfirm = jest.fn();
      render(
        <DeliveryDatePicker
          value="2026-08-20"
          availability={mockSchedule}
          onChange={jest.fn()}
          onConfirm={handleConfirm}
          showConfirmButton={true}
          confirmButtonLabel="Confirm Delivery Slot"
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /Confirm Delivery Slot/i });
      expect(confirmBtn).toBeInTheDocument();

      await user.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-08-20',
          currencySymbol: '₹',
        })
      );
    });
  });

  describe('Calendar Popover & Availability Grid', () => {
    it('opens full calendar popover when More dates button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DeliveryDatePicker
          value="2026-08-20"
          availability={mockSchedule}
          onChange={jest.fn()}
        />
      );

      const moreDatesBtn = screen.getByRole('button', { name: /open full delivery calendar/i });
      await user.click(moreDatesBtn);

      expect(screen.getByText('Delivery calendar')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });
  });

  describe('Delivery Utilities', () => {
    it('formatSlotPrice formats free and paid amounts correctly', () => {
      expect(formatSlotPrice(0, '₹')).toBe('FREE');
      expect(formatSlotPrice(40, '₹')).toBe('₹40');
      expect(formatSlotPrice(99, '$')).toBe('$99');
    });

    it('findDeliveryAvailability matches dates correctly', () => {
      const found = findDeliveryAvailability('2026-08-20', mockSchedule);
      expect(found).not.toBeNull();
      expect(found?.badge).toBe('FASTEST');

      const notFound = findDeliveryAvailability('2099-01-01', mockSchedule);
      expect(notFound).toBeNull();
    });

    it('createDefaultDeliverySchedule generates valid future schedule', () => {
      const schedule = createDefaultDeliverySchedule(7, '₹');
      expect(schedule).toHaveLength(7);
      expect(schedule[0].available).toBe(true);
      expect(schedule[0].slots).toBeDefined();
    });
  });
});

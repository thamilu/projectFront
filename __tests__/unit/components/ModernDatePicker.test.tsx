import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModernDatePicker } from '@/shared/ui/molecules/date-picker/ModernDatePicker';
import {
  parseSafeDate,
  formatDateISO,
  formatDisplayDate,
  isDateInRange,
  isMonthInRange,
  isYearInRange,
} from '@/shared/ui/molecules/date-picker/utils/date-validation';
import { generateYearRange } from '@/shared/ui/molecules/date-picker/utils/date-picker.utils';

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

describe('ModernDatePicker Component — Enterprise Test Suite', () => {
  describe('Rendering & Display', () => {
    it('renders input button with placeholder when value is empty', () => {
      render(<ModernDatePicker value="" onChange={jest.fn()} placeholder="Choose DOB" />);
      expect(screen.getByRole('button')).toHaveTextContent('Choose DOB');
    });

    it('renders formatted date when valid ISO value is provided', () => {
      render(<ModernDatePicker value="2026-05-15" onChange={jest.fn()} />);
      // Default display format is now 'PP' → "May 15, 2026" (no ordinals)
      expect(screen.getByRole('button', { name: /May 15, 2026/i })).toBeInTheDocument();
    });

    it('supports custom displayFormat', () => {
      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={jest.fn()}
          displayFormat="dd/MM/yyyy"
        />
      );
      expect(screen.getByRole('button', { name: /15\/05\/2026/i })).toBeInTheDocument();
    });

    it('renders error state and sets aria-invalid when error is present', () => {
      render(
        <ModernDatePicker
          value=""
          onChange={jest.fn()}
          error="Date is required"
        />
      );
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-invalid', 'true');
    });

    it('applies disabled state when disabled is true', () => {
      render(<ModernDatePicker value="" onChange={jest.fn()} disabled />);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
    });

    it('applies aria-readonly and aria-required attributes appropriately', () => {
      render(<ModernDatePicker value="" onChange={jest.fn()} readOnly required />);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-readonly', 'true');
      expect(btn).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Popover & Navigation', () => {
    it('opens popover panel when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<ModernDatePicker value="2026-05-15" onChange={jest.fn()} />);
      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });

      await user.click(triggerBtn);

      // Calendar view shows clickable month/year header
      expect(screen.getByText('May 2026')).toBeInTheDocument();
    });

    it('toggles to month/year selector when header is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={handleChange}
          yearRange={{ from: 2020, to: 2030 }}
        />
      );
      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });

      await user.click(triggerBtn);

      // Click the month/year header to switch to month/year selector
      const headerBtn = screen.getByRole('button', {
        name: /switch to month and year selector/i,
      });
      await user.click(headerBtn);

      // Should show year and month grid
      expect(screen.getByText('2026')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /June 2026/i })).toBeInTheDocument();

      // Click June to navigate
      await user.click(screen.getByRole('button', { name: /June 2026/i }));

      // Should switch back to calendar view showing June
      expect(screen.getByText('June 2026')).toBeInTheDocument();
    });

    it('selects date in calendar and calls onChange', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<ModernDatePicker value="2026-05-15" onChange={handleChange} />);
      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });

      await user.click(triggerBtn);

      const dayBtn = screen.getByRole('gridcell', { name: /Wednesday, May 20, 2026/i });
      expect(dayBtn).toBeInTheDocument();

      await user.click(dayBtn);
      expect(handleChange).toHaveBeenCalledWith('2026-05-20');
    });

    it('clears date using footer Clear button', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<ModernDatePicker value="2026-05-15" onChange={handleChange} />);
      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });

      await user.click(triggerBtn);

      const clearBtn = screen.getByRole('button', { name: /^clear$/i });
      await user.click(clearBtn);

      expect(handleChange).toHaveBeenCalledWith(null);
    });

    it('clears date using inline trigger clear icon', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<ModernDatePicker value="2026-05-15" onChange={handleChange} clearable />);

      const inlineClearBtn = screen.getByRole('button', { name: /clear selected date/i });
      expect(inlineClearBtn).toBeInTheDocument();

      await user.click(inlineClearBtn);
      expect(handleChange).toHaveBeenCalledWith(null);
    });

    it('selects Today using footer Today button', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<ModernDatePicker value="2020-01-01" onChange={handleChange} />);
      const triggerBtn = screen.getByRole('button', { name: /Jan 1, 2020/i });

      await user.click(triggerBtn);

      const todayBtn = screen.getByRole('button', { name: /today/i });
      await user.click(todayBtn);

      const todayISO = formatDateISO(new Date());
      expect(handleChange).toHaveBeenCalledWith(todayISO);
    });
  });

  describe('Boundary Enforcement (minDate & maxDate)', () => {
    it('disables dates outside minDate and maxDate', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const minDate = new Date(2026, 4, 10); // May 10, 2026
      const maxDate = new Date(2026, 4, 20); // May 20, 2026

      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={handleChange}
          minDate={minDate}
          maxDate={maxDate}
        />
      );

      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });
      await user.click(triggerBtn);

      // May 5th is before minDate -> should be disabled
      const beforeMinDay = screen.getByRole('gridcell', { name: /Tuesday, May 5, 2026/i });
      expect(beforeMinDay).toBeDisabled();

      // May 25th is after maxDate -> should be disabled
      const afterMaxDay = screen.getByRole('gridcell', { name: /Monday, May 25, 2026/i });
      expect(afterMaxDay).toBeDisabled();

      // May 15th is within range -> enabled
      const validDay = screen.getByRole('gridcell', { name: /Friday, May 15, 2026/i });
      expect(validDay).not.toBeDisabled();
    });

    it('disables dates based on custom isDateDisabled predicate', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      // Disable all weekend days
      const isDateDisabled = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={handleChange}
          isDateDisabled={isDateDisabled}
        />
      );

      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });
      await user.click(triggerBtn);

      // May 16, 2026 is Saturday -> disabled
      const saturday = screen.getByRole('gridcell', { name: /Saturday, May 16, 2026/i });
      expect(saturday).toBeDisabled();

      // May 15, 2026 is Friday -> enabled
      const friday = screen.getByRole('gridcell', { name: /Friday, May 15, 2026/i });
      expect(friday).not.toBeDisabled();
    });
  });

  describe('Date Validation & Utility Functions', () => {
    it('parseSafeDate parses ISO strings without timezone offsets', () => {
      const parsed = parseSafeDate('2026-08-19');
      expect(parsed).not.toBeNull();
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(7); // August = 7 (0-indexed)
      expect(parsed?.getDate()).toBe(19);
    });

    it('parseSafeDate returns null for invalid strings', () => {
      expect(parseSafeDate('')).toBeNull();
      expect(parseSafeDate('invalid-date')).toBeNull();
      expect(parseSafeDate('2026-02-31')).toBeNull(); // Non-existent date
      expect(parseSafeDate(null)).toBeNull();
      expect(parseSafeDate(undefined)).toBeNull();
    });

    it('formatDateISO and formatDisplayDate output expected strings', () => {
      const date = new Date(2026, 4, 15);
      expect(formatDateISO(date)).toBe('2026-05-15');
      // Default display format is now 'PP' → "May 15, 2026"
      expect(formatDisplayDate(date)).toBe('May 15, 2026');
    });

    it('boundary check utilities evaluate correctly', () => {
      const min = new Date(2025, 0, 1);
      const max = new Date(2027, 11, 31);

      expect(isYearInRange(2026, min, max)).toBe(true);
      expect(isYearInRange(2024, min, max)).toBe(false);
      expect(isYearInRange(2028, min, max)).toBe(false);

      expect(isMonthInRange(2025, 5, min, max)).toBe(true);
      expect(isDateInRange(new Date(2026, 5, 15), min, max)).toBe(true);
      expect(isDateInRange(new Date(2024, 5, 15), min, max)).toBe(false);
    });

    it('generateYearRange generates correct year list respecting bounds', () => {
      const years = generateYearRange({
        minDate: new Date(2020, 0, 1),
        maxDate: new Date(2025, 11, 31),
      });
      expect(years[0]).toBe(2025);
      expect(years[years.length - 1]).toBe(2020);
      expect(years).toEqual([2025, 2024, 2023, 2022, 2021, 2020]);
    });
  });

  describe('Localization & Week Configuration', () => {
    it('supports weekStartsOn=1 (Monday first)', async () => {
      const user = userEvent.setup();
      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={jest.fn()}
          weekStartsOn={1}
        />
      );

      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });
      await user.click(triggerBtn);

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders[0]).toHaveTextContent('Mo');
      expect(columnHeaders[6]).toHaveTextContent('Su');
    });
  });

  describe('Keyboard Navigation', () => {
    it('selects date with Enter key in calendar grid', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={handleChange}
        />
      );

      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });
      await user.click(triggerBtn);

      const dayCell = screen.getByRole('gridcell', { name: /Friday, May 15, 2026/i });
      dayCell.focus();

      await user.keyboard('{Enter}');
      expect(handleChange).toHaveBeenCalledWith('2026-05-15');
    });

    it('selects date with Space key in calendar grid', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={handleChange}
        />
      );

      const triggerBtn = screen.getByRole('button', { name: /May 15, 2026/i });
      await user.click(triggerBtn);

      const dayCell = screen.getByRole('gridcell', { name: /Friday, May 15, 2026/i });
      dayCell.focus();

      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith('2026-05-15');
    });
  });

  describe('Month/Year Selector', () => {
    it('navigates years with prev/next arrows in month/year view', async () => {
      const user = userEvent.setup();
      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={jest.fn()}
          yearRange={{ from: 2020, to: 2030 }}
        />
      );

      // Open popover
      await user.click(screen.getByRole('button', { name: /May 15, 2026/i }));

      // Switch to month/year selector
      await user.click(screen.getByRole('button', { name: /switch to month and year selector/i }));

      expect(screen.getByText('2026')).toBeInTheDocument();

      // Navigate to previous year
      await user.click(screen.getByRole('button', { name: /previous year/i }));
      expect(screen.getByText('2025')).toBeInTheDocument();

      // Navigate to next year
      await user.click(screen.getByRole('button', { name: /next year/i }));
      expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('disables out-of-range months in month/year selector', async () => {
      const user = userEvent.setup();
      const minDate = new Date(2026, 3, 1); // April 2026
      const maxDate = new Date(2026, 8, 30); // September 2026

      render(
        <ModernDatePicker
          value="2026-05-15"
          onChange={jest.fn()}
          minDate={minDate}
          maxDate={maxDate}
        />
      );

      // Open popover
      await user.click(screen.getByRole('button', { name: /May 15, 2026/i }));

      // Switch to month/year view
      await user.click(screen.getByRole('button', { name: /switch to month and year selector/i }));

      // January should be disabled (before April)
      const janBtn = screen.getByRole('button', { name: /January 2026/i });
      expect(janBtn).toBeDisabled();

      // May should be enabled (within range)
      const mayBtn = screen.getByRole('button', { name: /May 2026/i });
      expect(mayBtn).not.toBeDisabled();

      // December should be disabled (after September)
      const decBtn = screen.getByRole('button', { name: /December 2026/i });
      expect(decBtn).toBeDisabled();
    });
  });
});
